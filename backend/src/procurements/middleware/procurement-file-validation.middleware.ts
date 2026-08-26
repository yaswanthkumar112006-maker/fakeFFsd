import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ProcurementFileLoggerService } from './procurement-file-logger';

// Router-level file-upload middleware for the Procurements module. The frontend sends
// attachments (resource spec at creation, invoice at log-purchase) as base64 data-URLs
// embedded in the JSON body rather than multipart/form-data, so this validates those
// fields server-side before they ever reach a DTO/controller — never trust the client's
// own MIME/size checks alone.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — matches the frontend's own upload limit
const DATA_URL_PATTERN = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/;
const FILE_FIELDS = ['specFileDataUrl', 'invoiceFileDataUrl'];

function base64ByteLength(payload: string): number {
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return (payload.length * 3) / 4 - padding;
}

@Injectable()
export class ProcurementFileValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: ProcurementFileLoggerService) { }

  use(req: Request, res: Response, next: NextFunction): void {
    const body = req.body || {};

    for (const field of FILE_FIELDS) {
      const value = body[field];
      if (value === undefined || value === null || value === '') continue;

      if (typeof value !== 'string') {
        this.reject(req, `${field} must be a base64 data URL string.`);
      }

      const match = (value as string).match(DATA_URL_PATTERN);
      if (!match) {
        this.reject(req, `${field} is not a valid base64 data URL.`);
      }

      const [, mimeType, base64Payload] = match as RegExpMatchArray;
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        this.reject(
          req,
          `${field} has unsupported file type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`,
        );
      }

      if (base64ByteLength(base64Payload) > MAX_FILE_BYTES) {
        this.reject(
          req,
          `${field} exceeds the maximum allowed size of ${MAX_FILE_BYTES / (1024 * 1024)}MB.`,
        );
      }
    }

    next();
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
