import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProfileFileLoggerService } from './profile-file-logger';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class ProfileValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: ProfileFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};
    const url = (req.originalUrl || req.url || '').split('?')[0];

    if (req.method === 'PATCH' && url.endsWith('/profile/me')) {
      if (body.name !== undefined) {
        this.requireText(req, body.name, 'Name', 100);
      }
      if (body.email !== undefined) {
        this.requireEmail(req, body.email);
      }
    }

    if (req.method === 'POST' && url.endsWith('/profile/me/password')) {
      if (typeof body.currentPassword !== 'string' || body.currentPassword.trim() === '') {
        this.reject(req, 'Current password is required.');
      }
      if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
        this.reject(req, 'New password must be a string and at least 8 characters long.');
      }
    }

    next();
  }

  private requireText(req: Request, value: unknown, label: string, maxLength: number): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.reject(req, `${label} cannot be empty.`);
    }
    if (value.length > maxLength) {
      this.reject(req, `${label} must be ${maxLength} characters or fewer.`);
    }
  }

  private requireEmail(req: Request, value: unknown): void {
    if (typeof value !== 'string' || !EMAIL_PATTERN.test(value)) {
      this.reject(req, 'A valid email address is required.');
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
