import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProcurementFileLoggerService } from './procurement-file-logger';

// Router-level security middleware for the Procurements module: a simple in-memory
// fixed-window rate limiter that throttles how fast any one caller can hit these
// endpoints, guarding the approval workflow against accidental spam (double-submits,
// runaway scripts) or deliberate abuse. Deliberately in-memory/per-process — this app
// has no shared cache layer, and per-process limiting is enough for this scope.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class ProcurementRateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private sweepTimer: NodeJS.Timeout;

  constructor(private readonly fileLogger: ProcurementFileLoggerService) {
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
          429,
          `key=${key.slice(0, 24)}...`,
          `Rate limit exceeded (${bucket.count}/${MAX_REQUESTS_PER_WINDOW} per ${WINDOW_MS / 1000}s)`,
        ].join(' | '),
      );

      throw new HttpException(
        'Too many procurement requests — please slow down and try again shortly.',
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
