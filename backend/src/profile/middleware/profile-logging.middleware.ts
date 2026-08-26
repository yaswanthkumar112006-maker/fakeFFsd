import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProfileFileLoggerService } from './profile-file-logger';

// Router-level logging middleware, applied only to the Profile module's routes.
@Injectable()
export class ProfileLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ProfileAPI');

  constructor(private readonly fileLogger: ProfileFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const context = (req as any).context || {};

      const line = [
        new Date().toISOString(),
        req.method,
        req.originalUrl || req.url,
        res.statusCode,
        `${durationMs}ms`,
        `role=${context.role || 'anonymous'}`,
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
