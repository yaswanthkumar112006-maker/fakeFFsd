import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AnnouncementType } from '../../common/domain';

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
@Injectable()
export class CommunicationsValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      requireText(body.title, 'Title', MAX_TITLE_LENGTH);
      requireText(body.message, 'Message', MAX_MESSAGE_LENGTH);

      const type = typeof body.type === 'string' ? body.type.trim() : '';
      const matchedType = ALLOWED_TYPES.find(
        (allowed) => allowed.toLowerCase() === type.toLowerCase(),
      );
      if (!matchedType) {
        throw new BadRequestException(
          `Invalid announcement type: "${body.type ?? ''}". Allowed values: ${ALLOWED_TYPES.join(', ')}.`,
        );
      }
      body.type = matchedType;

      requireText(body.targetOrgId, 'Target organisation', 64);
    }

    if (req.method === 'PATCH') {
      if (!extractAnnouncementId(req)) {
        throw new BadRequestException('Announcement ID parameter is required.');
      }
      requireText(body.reply, 'Reply', MAX_MESSAGE_LENGTH);
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
