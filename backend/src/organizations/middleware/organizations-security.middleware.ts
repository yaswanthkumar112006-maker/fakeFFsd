import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { OrganizationsFileLoggerService } from './organizations-file-logger';

// Security middleware (part 1) — hardens every response on the Organizations
// routes with the standard protective headers.
@Injectable()
export class OrganizationsSecurityHeadersMiddleware implements NestMiddleware {
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
const MAX_REQUESTS_PER_WINDOW = 30;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

// Security middleware (part 2) — a fixed-window, in-memory rate limiter, scoped to
// this module's own bucket map. Matters more here than most modules: POST
// /register is @Public() (no auth token), so it's the one route in this app an
// anonymous caller can hit directly — this is what stands between it and a spam
// flood of organization sign-ups. Falls back to the caller's IP as the bucket key
// for exactly that route, since there's no bearer token to key on.
@Injectable()
export class OrganizationsRateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly fileLogger: OrganizationsFileLoggerService) {
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
          `Rate limit exceeded (${bucket.count}/${MAX_REQUESTS_PER_WINDOW} per ${WINDOW_MS / 1000}s)`,
        ].join(' | '),
      );

      throw new HttpException(
        'Too many organization requests — please slow down and try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  private resolveKey(req: Request): string {
    return req.headers.authorization || req.ip || 'anonymous';
  }
}
