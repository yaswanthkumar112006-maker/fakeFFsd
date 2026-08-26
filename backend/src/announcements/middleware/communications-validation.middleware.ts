import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AnnouncementType } from '../../common/domain';
import { CommunicationsFileLoggerService } from './communications-file-logger';

// Must stay in step with the AnnouncementType union and CreateAnnouncementDto's @IsIn list.
const ALLOWED_TYPES: AnnouncementType[] = ['Maintenance', 'New Feature', 'Policy', 'General'];

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Router-level validation middleware for the Communications API (/api/announcements).
//
//   GET   /                — list announcements (nothing to validate)
//   POST  /                — broadcast: title, message, type and targetOrgId required
//   PATCH /:id/reply       — admin reply: reply body required
//
// A broadcast fans out to every organisation when targetOrgId is 'ALL', so a
// malformed payload is worth stopping at the door rather than part-way through.
// Runs before Nest resolves a controller, so CommunicationsExceptionFilter isn't in
// scope for anything thrown here — self-logs via reject() so a rejection is still
// captured in communications-error.log either way.
@Injectable()
export class CommunicationsValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: CommunicationsFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      this.requireText(req, body.title, 'Title', MAX_TITLE_LENGTH);
      this.requireText(req, body.message, 'Message', MAX_MESSAGE_LENGTH);

      const type = typeof body.type === 'string' ? body.type.trim() : '';
      const matchedType = ALLOWED_TYPES.find(
        (allowed) => allowed.toLowerCase() === type.toLowerCase(),
      );
      if (!matchedType) {
        this.reject(
          req,
          `Invalid announcement type: "${body.type ?? ''}". Allowed values: ${ALLOWED_TYPES.join(', ')}.`,
        );
      }
      body.type = matchedType;

      this.requireText(req, body.targetOrgId, 'Target organisation', 64);
    }

    if (req.method === 'PATCH') {
      if (!extractAnnouncementId(req)) {
        this.reject(req, 'Announcement ID parameter is required.');
      }
      this.requireText(req, body.reply, 'Reply', MAX_MESSAGE_LENGTH);
    }

    next();
  }

  private requireText(req: Request, value: unknown, label: string, maxLength: number): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.reject(req, `${label} is required and cannot be empty.`);
    }
    if ((value as string).length > maxLength) {
      this.reject(req, `${label} must be ${maxLength} characters or fewer.`);
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

// req.params is empty in middleware, so read the id from the URL: /api/announcements/:id/reply.
function extractAnnouncementId(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('announcements');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
