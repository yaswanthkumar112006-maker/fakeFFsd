import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ReturnsFileLoggerService } from './returns-file-logger';

// The one write action the Returns controller exposes under /:resourceId.
const ALLOWED_ACTIONS = ['process'];

// Resource ids look like RES-6001 — letters, digits and dashes only.
const RESOURCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Router-level validation middleware for the Returns API (/api/returns).
//
//   GET  /history                    — return history (nothing to validate)
//   POST /:resourceId/process        — staff processes a returned resource
//
// Processing a return updates the resource's condition and status, which is
// state-mutating and irreversible, so both the resourceId and action segment
// are validated here before the request ever reaches the service layer.
// Runs before Nest resolves a controller, so ReturnsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is
// still captured in returns-error.log either way.
@Injectable()
export class ReturnsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: ReturnsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'POST') {
      return next();
    }

    const { resourceId, action } = parseReturnsUrl(req);

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
        `Invalid returns action: "${action ?? ''}". Allowed actions: ${ALLOWED_ACTIONS.join(', ')}.`,
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
// segments out of the URL directly: /api/returns/:resourceId/:action.
function parseReturnsUrl(req: Request): {
  resourceId: string | null;
  action: string | null;
} {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('returns');
  if (index === -1) return { resourceId: null, action: null };

  const rawId = (parts[index + 1] || '').trim();
  const action = (parts[index + 2] || '').trim() || null;

  const resourceId =
    !rawId || rawId === 'undefined' || rawId === 'null' || rawId === 'history'
      ? null
      : rawId;

  return { resourceId, action };
}
