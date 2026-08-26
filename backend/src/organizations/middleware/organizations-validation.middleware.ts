import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { OrganizationsFileLoggerService } from './organizations-file-logger';

// Router-level validation middleware for the Organizations API (/api/organizations).
//
//   GET   /, /public                — read-only, nothing to validate
//   POST  /register                 — already fully validated by the global
//                                      ValidationPipe via RegisterOrgDto
//   PATCH /:id/approve               — :id required; body.employeeId required
//   PATCH /:id/suspend, /:id/reactivate — :id required
//   GET   /my-org/details            — nothing to validate (id comes from the JWT)
//   PATCH /my-org/subscription       — body.planId required
//
// approve/suspend/reactivate/my-org-subscription all read their body fields with a
// raw @Body('key') on the controller rather than a class-validator DTO, so — unlike
// most of this app's PATCH routes — nothing upstream of the service currently
// checks these are present. That's the actual gap this middleware closes.
//
// Runs before Nest resolves a controller, so OrganizationsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in organizations-error.log either way.
@Injectable()
export class OrganizationsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: OrganizationsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'PATCH') {
      return next();
    }

    const { segment, action } = parseOrganizationsUrl(req);
    const body = req.body || {};

    if (segment === 'my-org') {
      if (action === 'subscription') {
        this.requireText(req, body.planId, 'planId');
      }
      return next();
    }

    // Otherwise segment is the organization id: /:id/approve|suspend|reactivate.
    if (!segment) {
      this.reject(req, 'Organization ID parameter is required.');
    }

    if (action === 'approve') {
      this.requireText(req, body.employeeId, 'employeeId');
    }

    next();
  }

  private requireText(req: Request, value: unknown, field: string): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.reject(req, `${field} is required and cannot be empty.`);
    }
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

// Middleware runs before route matching, so req.params is empty here. Read the
// segments out of the URL instead: /api/organizations/:segment/:action.
function parseOrganizationsUrl(req: Request): { segment: string | null; action: string | null } {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.indexOf('organizations');
  if (index === -1) return { segment: null, action: null };

  const rawSegment = (parts[index + 1] || '').trim();
  const action = (parts[index + 2] || '').trim() || null;
  const segment = !rawSegment || rawSegment === 'undefined' || rawSegment === 'null' ? null : rawSegment;

  return { segment, action };
}
