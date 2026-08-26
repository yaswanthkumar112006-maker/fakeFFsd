import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProcurementFileLoggerService } from './procurement-file-logger';

// Router-level logging middleware, applied only to the Procurements module's routes
// (see ProcurementsModule#configure). Logs every request/response pair — including
// ones rejected by later middleware or guards — to the console and to a log file.
@Injectable()
export class ProcurementLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ProcurementsAPI');

  constructor(private readonly fileLogger: ProcurementFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      // Set by AuthGuard, which runs after middleware — by the time 'finish' fires the
      // whole request lifecycle (including guards) has already completed, so it's populated.
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
