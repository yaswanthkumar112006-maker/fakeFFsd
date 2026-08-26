import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ROLES } from '../../common/roles';

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class UsersValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      const url = (req.originalUrl || req.url || '').split('?')[0];
      const isCreateEmployee = url.endsWith('/create-employee');

      if (isCreateEmployee) {
        requireText(body.name, 'Name', 100);
        requireEmail(body.email);
      } else {
        // Standard user creation
        requireUserId(body.id);
        requireText(body.name, 'Name', 100);
        requireEmail(body.email);

        if (typeof body.password !== 'string' || body.password.length < 8) {
          throw new BadRequestException('Password must be a string and at least 8 characters long.');
        }

        const role = typeof body.role === 'string' ? body.role.trim() : '';
        const matchedRole = ROLES.find(
          (allowed) => allowed.toLowerCase() === role.toLowerCase(),
        );
        if (!matchedRole) {
          throw new BadRequestException(
            `Invalid role: "${body.role ?? ''}". Allowed values: ${ROLES.join(', ')}.`,
          );
        }
        body.role = matchedRole;
      }
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const userId = extractUserIdFromUrl(req);
      if (!userId) {
        throw new BadRequestException('User ID parameter is required.');
      }
      if (!USER_ID_PATTERN.test(userId)) {
        throw new BadRequestException(`Invalid User ID: "${userId}".`);
      }
    }

    next();
  }
}

function requireText(value: unknown, label: string, maxLength: number): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${label} is required and cannot be empty.`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(`${label} must be ${maxLength} characters or fewer.`);
  }
}

function requireEmail(value: unknown): void {
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value)) {
    throw new BadRequestException('A valid email address is required.');
  }
}

function requireUserId(value: unknown): void {
  if (typeof value !== 'string' || !USER_ID_PATTERN.test(value)) {
    throw new BadRequestException('ID is required and must contain alphanumeric characters, dashes, or underscores only.');
  }
}

// req.params is empty in middleware, so read the id from the URL: /api/users/:id
function extractUserIdFromUrl(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('users');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  // ignore auxiliary endpoints
  if (!id || id === 'undefined' || id === 'null' || id === 'mock') return null;
  return id;
}
