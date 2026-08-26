import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ServiceFileLoggerService } from './service-file-logger';

/**
 * Logging middleware — applied to the Support, Communications (Announcements)
 * and Maintenance controllers.
 *
 * Registered first in every module's consumer chain so that a request is recorded
 * even when a later middleware, guard or validation pipe rejects it. Writes on the
 * 'finish' event, by which point the whole request lifecycle has run, so the status
 * code and the auth context populated by AuthGuard are both available.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ServicesAPI');

  constructor(private readonly fileLogger: ServiceFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const context = (req as any).context || {};
      const upload = describeUpload(req);

      const line = [
        new Date().toISOString(),
        req.method,
        req.originalUrl || req.url,
        res.statusCode,
        `${durationMs}ms`,
        `role=${context.role || 'anonymous'}`,
        `user=${context.userId || 'anonymous'}`,
        ...(upload ? [upload] : []),
      ].join(' | ');

      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);

      this.fileLogger.logAccess(line);
    });

    next();
  }
}

/** Note any file the upload middleware attached, so uploads are traceable in the log. */
function describeUpload(req: Request): string | null {
  const single = (req as any).file;
  if (single) return `file=${single.filename} (${single.size}b)`;

  const many = (req as any).files;
  const list = Array.isArray(many) ? many : many ? Object.values(many).flat() : [];
  if (list.length > 0) {
    return `files=${list.map((f: any) => f.filename).join(',')}`;
  }
  return null;
}
