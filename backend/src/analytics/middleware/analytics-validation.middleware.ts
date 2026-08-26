import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AnalyticsFileLoggerService } from './analytics-file-logger';

// Router-level validation middleware for the Analytics API (/api/analytics).
//
//   GET   /requestor-summary, /department-summary, /registrar-summary, /stock
//         — read-only, nothing to validate
//   PATCH /stock-thresholds/:id/:level
//         — the controller itself already validates :level (must parse to a
//           non-negative integer); this middleware covers the one thing it
//           doesn't: rejecting a missing/malformed :id before it reaches the
//           controller at all.
//
// Runs before Nest resolves a controller, so AnalyticsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in analytics-error.log either way.
@Injectable()
export class AnalyticsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: AnalyticsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'PATCH') {
      const id = extractStockThresholdId(req);
      if (!id) {
        this.reject(req, 'Stock threshold ID parameter is required.');
      }
    }

    next();
  }

  private reject(req: Request, message: string): never {
    const context = (req as any).context || {};
    this.fileLogger.logError(
      [
        new Date().toISOString(),
        'ERROR',
        req.method,
        req.originalUrl,
        400,
        `role=${context.role || 'unknown'}`,
        `user=${context.userId || 'anonymous'}`,
        message,
      ].join(' | '),
    );
    throw new BadRequestException(message);
  }
}

// Middleware runs before route matching, so req.params is empty here. Read the id
// out of the URL instead: /api/analytics/stock-thresholds/:id/:level.
function extractStockThresholdId(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('stock-thresholds');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
