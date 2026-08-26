import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TicketStatus } from '../../common/domain';
import { SupportFileLoggerService } from './support-file-logger';

// Canonical ticket states, matching the TicketStatus union in common/domain and the
// @IsIn list on ResolveTicketDto.
const ALLOWED_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved'];

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;

// Router-level validation middleware for the Support API (/api/support).
//
//   GET    /                 — list tickets (nothing to validate)
//   POST   /                 — create a ticket: title + description required
//   PATCH  /:id/resolve      — resolve/reply: reply required, status optional
//
// Runs before Nest resolves a controller, so SupportExceptionFilter (@UseFilters()
// on SupportController) isn't in scope for anything thrown here — self-logs via
// reject() so a rejection is still captured in support-error.log either way.
@Injectable()
export class SupportValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: SupportFileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      this.requireText(req, body.title, 'Title', MAX_TITLE_LENGTH);
      this.requireText(req, body.description, 'Description', MAX_TEXT_LENGTH);
    }

    if (req.method === 'PATCH') {
      const ticketId = extractTicketId(req);
      if (!ticketId) {
        this.reject(req, 'Ticket ID parameter is required.');
      }

      this.requireText(req, body.reply, 'Reply', MAX_TEXT_LENGTH);

      if (body.status !== undefined && body.status !== null && body.status !== '') {
        if (typeof body.status !== 'string') {
          this.reject(req, 'Status must be a string.');
        }

        const match = ALLOWED_STATUSES.find(
          (allowed) => allowed.toLowerCase() === body.status.trim().toLowerCase(),
        );

        if (!match) {
          this.reject(
            req,
            `Invalid ticket status: "${body.status}". Allowed values: ${ALLOWED_STATUSES.join(', ')}.`,
          );
        }

        body.status = match;
      }
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

// Middleware runs before the router matches a route, so req.params is empty here.
// Read the id out of the URL instead: /api/support/:id/resolve.
function extractTicketId(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('support');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
