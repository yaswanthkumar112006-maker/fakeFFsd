import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ReturnsFileLoggerService } from './returns-file-logger';

// Security middleware (part 1) — hardens every response on the Returns routes
// with the standard protective headers.
@Injectable()
export class ReturnsSecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
    );
    res.setHeader('Cache-Control', 'no-store');
    res.removeHeader('X-Powered-By');

    next();
  }
}

const WINDOW_MS = 60 * 1000;
// Returns are lower-volume staff actions (processing returned items), so the
// limit is modest — 30 per minute per caller is generous for normal usage.
const MAX_REQUESTS_PER_WINDOW = 30;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

// Security middleware (part 2) — a fixed-window, in-memory rate limiter.
// Processing a return mutates resource state (condition update, status change),
// so throttling bursts guards against double-submits or runaway automation.
@Injectable()
export class ReturnsRateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly fileLogger: ReturnsFileLoggerService) {
    // Prevent unbounded growth of the bucket map from one-off/anonymous callers.
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(key);
      }
    }, SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const key = this.resolveKey(req);
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS_PER_WINDOW - bucket.count)));

    if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));

      this.fileLogger.logError(
        [
          new Date().toISOString(),
          'ERROR',
          req.method,
          req.originalUrl,
          HttpStatus.TOO_MANY_REQUESTS,
          `key=${key.slice(0, 24)}...`,
          `Rate limit exceeded (${bucket.count}/${MAX_REQUESTS_PER_WINDOW} per ${WINDOW_MS / 1000}s)`,
        ].join(' | '),
      );

      throw new HttpException(
        'Too many return requests — please slow down and try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  // Guards run after middleware, so req.context (userId/role) isn't populated yet here.
  // The raw bearer token is still a stable per-user key, which is what actually matters.
  private resolveKey(req: Request): string {
    return req.headers.authorization || req.ip || 'anonymous';
  }
}
