import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ROLES } from '../../common/roles';
import { PermissionsFileLoggerService } from './permissions-file-logger';

// Router-level validation middleware for the Permissions API (/api/permissionsMatrix).
//
//   GET  /                — read the matrix (nothing to validate)
//   POST /                — replace the matrix: UpdatePermissionsMatrixDto only
//                            checks that `matrix` is *an* object (@IsObject()) — it
//                            never checks what's inside it. This middleware closes
//                            that gap: every entry must map to a non-empty array of
//                            valid Role strings, since RolesGuard reads this matrix
//                            straight out of the data store to decide who can do
//                            what — a malformed entry here breaks authorization
//                            everywhere, not just in this module.
//   POST /reset            — reset to defaults (nothing to validate)
//
// Runs before Nest resolves a controller, so PermissionsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in permissions-error.log either way.
@Injectable()
export class PermissionsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: PermissionsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'POST') {
      return next();
    }

    const { action } = parsePermissionsUrl(req);
    if (action === 'reset') {
      return next();
    }

    const body = req.body || {};
    this.validateMatrix(req, body.matrix);

    next();
  }

  private validateMatrix(req: Request, matrix: unknown): void {
    if (typeof matrix !== 'object' || matrix === null || Array.isArray(matrix)) {
      this.reject(req, 'matrix must be an object mapping permission names to arrays of roles.');
    }

    for (const [permission, roles] of Object.entries(matrix as Record<string, unknown>)) {
      if (!Array.isArray(roles) || roles.length === 0) {
        this.reject(req, `matrix["${permission}"] must be a non-empty array of roles.`);
      }

      for (const role of roles) {
        const isValidRole = typeof role === 'string' && (ROLES as readonly string[]).includes(role);
        if (!isValidRole) {
          this.reject(
            req,
            `matrix["${permission}"] contains an invalid role: "${role}". Allowed values: ${ROLES.join(', ')}.`,
          );
        }
      }
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
// action out of the URL instead: /api/permissionsMatrix[/reset].
function parsePermissionsUrl(req: Request): { action: string | null } {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.findIndex((part) => part.toLowerCase() === 'permissionsmatrix');
  if (index === -1) return { action: null };

  const action = (parts[index + 1] || '').trim() || null;
  return { action };
}
