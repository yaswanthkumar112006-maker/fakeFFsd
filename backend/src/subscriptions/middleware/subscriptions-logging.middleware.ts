import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SubscriptionsFileLoggerService } from './subscriptions-file-logger';

// Router-level logging middleware, applied only to the Subscriptions module's
// routes (see SubscriptionsModule#configure). Logs every request/response pair —
// including ones rejected by later middleware — to the console and to a log file.
@Injectable()
export class SubscriptionsLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SubscriptionsAPI');

  constructor(private readonly fileLogger: SubscriptionsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const context = (req as any).context || {};

      const line = [
        new Date().toISOString(),
        req.method,
        req.originalUrl,
        res.statusCode,
        `${durationMs}ms`,
        `role=${context.role || 'unknown'}`,
        `user=${context.userId || 'anonymous'}`,
      ].join(' | ');

      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);

      this.fileLogger.logAccess(line);
    });

    next();
  }
}
