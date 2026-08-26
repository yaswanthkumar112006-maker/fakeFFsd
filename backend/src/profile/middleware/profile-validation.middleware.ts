import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class ProfileValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};
    const url = (req.originalUrl || req.url || '').split('?')[0];

    if (req.method === 'PATCH' && url.endsWith('/profile/me')) {
      if (body.name !== undefined) {
        requireText(body.name, 'Name', 100);
      }
      if (body.email !== undefined) {
        requireEmail(body.email);
      }
    }

    if (req.method === 'POST' && url.endsWith('/profile/me/password')) {
      if (typeof body.currentPassword !== 'string' || body.currentPassword.trim() === '') {
        throw new BadRequestException('Current password is required.');
      }
      if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
        throw new BadRequestException('New password must be a string and at least 8 characters long.');
      }
    }

    next();
  }
}

function requireText(value: unknown, label: string, maxLength: number): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${label} cannot be empty.`);
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
