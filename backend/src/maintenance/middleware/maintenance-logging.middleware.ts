import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MaintenanceFileLoggerService } from './maintenance-file-logger';

// Router-level logging middleware, applied only to the Maintenance module's routes
// (see MaintenanceModule#configure).
@Injectable()
export class MaintenanceLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('MaintenanceAPI');

  constructor(private readonly fileLogger: MaintenanceFileLoggerService) {}

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
