import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TicketStatus } from '../domain';

/**
 * Canonical ticket states, matching the TicketStatus union in common/domain and the
 * @IsIn list on ResolveTicketDto. These three lists have to agree — when they didn't,
 * every possible resolve payload was rejected: this middleware demanded uppercase
 * "RESOLVED" while the DTO's ValidationPipe demanded "Resolved".
 */
const ALLOWED_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved'];

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;

/**
 * Router-level middleware for the Support API (/api/support).
 *
 *   GET    /                 — list tickets (nothing to validate)
 *   POST   /                 — create a ticket: title + description required
 *   PATCH  /:id/resolve      — resolve/reply: reply required, status optional
 *
 * Runs after the upload middleware, so req.body is already populated for both JSON
 * and multipart/form-data submissions and one validation path covers both.
 */
@Injectable()
export class SupportRouterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    if (req.method === 'POST') {
      requireText(body.title, 'Title', MAX_TITLE_LENGTH);
      requireText(body.description, 'Description', MAX_TEXT_LENGTH);
    }

    if (req.method === 'PATCH') {
      const ticketId = extractTicketId(req);
      if (!ticketId) {
        throw new BadRequestException('Ticket ID parameter is required.');
      }

      requireText(body.reply, 'Reply', MAX_TEXT_LENGTH);

      // status is optional — the service defaults it to 'Resolved'. Only validate
      // it when the caller actually sent one.
      if (body.status !== undefined && body.status !== null && body.status !== '') {
        if (typeof body.status !== 'string') {
          throw new BadRequestException('Status must be a string.');
        }

        // Accept any casing the caller sends and normalise to the canonical value,
        // so "RESOLVED" and "resolved" both reach the DTO as "Resolved".
        const match = ALLOWED_STATUSES.find(
          (allowed) => allowed.toLowerCase() === body.status.trim().toLowerCase(),
        );

        if (!match) {
          throw new BadRequestException(
            `Invalid ticket status: "${body.status}". Allowed values: ${ALLOWED_STATUSES.join(', ')}.`,
          );
        }

        body.status = match;
      }
    }

    next();
  }
}

/** Require a non-empty string within a length bound, or reject with a clear message. */
function requireText(value: unknown, label: string, maxLength: number): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${label} is required and cannot be empty.`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(`${label} must be ${maxLength} characters or fewer.`);
  }
}

/**
 * Middleware runs before the router matches a route, so req.params is empty here.
 * Read the id out of the URL instead: /api/support/:id/resolve.
 */
function extractTicketId(req: Request): string | null {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const index = parts.lastIndexOf('support');
  if (index === -1) return null;

  const id = (parts[index + 1] || '').trim();
  if (!id || id === 'undefined' || id === 'null') return null;
  return id;
}
