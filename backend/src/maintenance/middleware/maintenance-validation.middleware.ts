import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MaintenanceFileLoggerService } from './maintenance-file-logger';

// The three write actions the Maintenance controller exposes under /:resourceId.
const ALLOWED_ACTIONS = ['accept', 'repair', 'scrap'];

// Resource ids look like RES-ITL-001 — letters, digits and dashes only.
const RESOURCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Router-level validation middleware for the Maintenance API (/api/maintenance).
//
//   GET  /history              — inspection logs (nothing to validate)
//   POST /:resourceId/accept   — receive an asset into repairs
//   POST /:resourceId/repair   — log maintenance details
//   POST /:resourceId/scrap    — retire a damaged item
//
// These actions mutate asset state irreversibly (scrap especially), so the
// resourceId and the action are checked before the request reaches the service.
// Runs before Nest resolves a controller, so MaintenanceExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in maintenance-error.log either way.
@Injectable()
export class MaintenanceValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: MaintenanceFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'POST') {
      return next();
    }

    const { resourceId, action } = parseMaintenanceUrl(req);

    if (!resourceId) {
      this.reject(req, 'Resource ID parameter is required.');
    }

    if (!RESOURCE_ID_PATTERN.test(resourceId as string)) {
      this.reject(
        req,
        `Invalid resourceId: "${resourceId}". Expected letters, digits, dashes or underscores.`,
      );
    }

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      this.reject(
        req,
        `Invalid maintenance action: "${action ?? ''}". Allowed actions: ${ALLOWED_ACTIONS.join(', ')}.`,
      );
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

// Middleware runs before route matching, so req.params is empty. Pull the two
// segments out of the URL directly: /api/maintenance/:resourceId/:action.
function parseMaintenanceUrl(req: Request): {
  resourceId: string | null;
  action: string | null;
} {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('maintenance');
  if (index === -1) return { resourceId: null, action: null };

  const rawId = (parts[index + 1] || '').trim();
  const action = (parts[index + 2] || '').trim() || null;

  const resourceId =
    !rawId || rawId === 'undefined' || rawId === 'null' || rawId === 'history'
      ? null
      : rawId;

  return { resourceId, action };
}
