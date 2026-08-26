import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/** The three write actions the Maintenance controller exposes under /:resourceId. */
const ALLOWED_ACTIONS = ['accept', 'repair', 'scrap'];

/** Resource ids look like RES-ITL-001 — letters, digits and dashes only. */
const RESOURCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Router-level middleware for the Maintenance API (/api/maintenance).
 *
 *   GET  /history              — inspection logs (nothing to validate)
 *   POST /:resourceId/accept   — receive an asset into repairs
 *   POST /:resourceId/repair   — log maintenance details
 *   POST /:resourceId/scrap    — retire a damaged item
 *
 * These actions mutate asset state irreversibly (scrap especially), so the
 * resourceId and the action are checked before the request reaches the service.
 */
@Injectable()
export class MaintenanceRouterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'POST') {
      return next();
    }

    const { resourceId, action } = parseMaintenanceUrl(req);

    if (!resourceId) {
      throw new BadRequestException('Resource ID parameter is required.');
    }

    if (!RESOURCE_ID_PATTERN.test(resourceId)) {
      throw new BadRequestException(
        `Invalid resourceId: "${resourceId}". Expected letters, digits, dashes or underscores.`,
      );
    }

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      throw new BadRequestException(
        `Invalid maintenance action: "${action ?? ''}". Allowed actions: ${ALLOWED_ACTIONS.join(', ')}.`,
      );
    }

    next();
  }
}

/**
 * Middleware runs before route matching, so req.params is empty. Pull the two
 * segments out of the URL directly: /api/maintenance/:resourceId/:action.
 */
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

  // 'history' is the GET collection route, never a resource id.
  const resourceId =
    !rawId || rawId === 'undefined' || rawId === 'null' || rawId === 'history'
      ? null
      : rawId;

  return { resourceId, action };
}
