import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ProcurementFileLoggerService } from './procurement-file-logger';

// Router-level file-upload middleware for the Procurements module. Attachments (resource
// spec at creation, invoice at log-purchase) arrive as real multipart/form-data uploads —
// multer parses them in memory and enforces the MIME/size checks below before the request
// ever reaches a DTO/controller, never trusting the client's own checks alone. Once a file
// clears validation it's folded back into the same specFileName/Type/DataUrl (and
// invoiceFileName/Type/DataUrl) body fields CreateProcurementDto/LogPurchaseDto already
// declare, so nothing downstream of this middleware has to know multipart was involved.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — matches the frontend's own upload limit
const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);

const FILE_FIELDS: Array<{ field: string; nameKey: string; typeKey: string; dataUrlKey: string }> = [
  { field: 'specFile', nameKey: 'specFileName', typeKey: 'specFileType', dataUrlKey: 'specFileDataUrl' },
  { field: 'invoiceFile', nameKey: 'invoiceFileName', typeKey: 'invoiceFileType', dataUrlKey: 'invoiceFileDataUrl' },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(
        new BadRequestException(
          `${file.fieldname} has unsupported file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`,
        ),
      );
      return;
    }
    cb(null, true);
  },
}).fields(FILE_FIELDS.map(({ field }) => ({ name: field, maxCount: 1 })));

@Injectable()
export class ProcurementFileValidationMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: ProcurementFileLoggerService) { }

  use(req: Request, res: Response, next: NextFunction): void {
    // multer only engages for multipart/form-data requests — any other content type
    // (or a request with no files at all) passes through untouched, since every file
    // field above is optional.
    upload(req, res, (err: unknown) => {
      if (err) {
        // multer invokes this callback asynchronously (after streaming the multipart
        // body), so a throw here would escape Express's try/catch around the initial
        // synchronous use() call and crash the process instead of producing a 400.
        // next(err) is the correct way to hand an async middleware error to Express.
        next(this.reject(req, this.toMessage(err)));
        return;
      }

      const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
      for (const { field, nameKey, typeKey, dataUrlKey } of FILE_FIELDS) {
        const file = files[field]?.[0];
        if (!file) continue;

        (req.body as Record<string, unknown>)[nameKey] = file.originalname;
        (req.body as Record<string, unknown>)[typeKey] = file.mimetype;
        (req.body as Record<string, unknown>)[dataUrlKey] =
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      next();
    });
  }

  private toMessage(err: unknown): string {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return `${err.field} exceeds the maximum allowed size of ${MAX_FILE_MB}MB.`;
      }
      return `${err.field ? `${err.field}: ` : ''}${err.message}`;
    }
    return (err as Error)?.message || 'Invalid file upload.';
  }

  private reject(req: Request, message: string): BadRequestException {
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
    return new BadRequestException(message);
  }
}
