import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { NotificationsFileLoggerService } from './notifications-file-logger';

// Router-level validation middleware for the Notifications API (/api/notifications).
//
//   GET   /       — list notifications (nothing to validate)
//   PATCH /:id    — update a notification's state (the `read` field itself is
//                   already validated by the global ValidationPipe via
//                   UpdateNotificationDto; the id param isn't, so that's what this
//                   middleware checks before the request reaches the controller)
//
// Runs before Nest resolves a controller, so NotificationsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in notifications-error.log either way.
@Injectable()
export class NotificationsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: NotificationsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'PATCH') {
      const id = extractNotificationId(req);
      if (!id) {
        this.reject(req, 'Notification ID parameter is required.');
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
// out of the URL instead: /api/notifications/:id.
function extractNotificationId(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('notifications');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
