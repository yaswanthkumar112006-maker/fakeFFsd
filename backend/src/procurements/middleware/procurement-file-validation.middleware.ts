import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import multer from 'multer';
import { ProcurementFileLoggerService } from './procurement-file-logger';

// Router-level file-upload middleware for the Procurements module. Attachments (resource
// spec at creation, invoice at log-purchase) arrive as real multipart/form-data uploads —
// multer streams them to disk and enforces the MIME/size checks below before the request
// ever reaches a DTO/controller, never trusting the client's own checks alone. Once a file
// clears validation, the middleware reads it back off disk and folds it into the same
// specFileName/Type/DataUrl (and invoiceFileName/Type/DataUrl) body fields
// CreateProcurementDto/LogPurchaseDto already declare, so nothing downstream of this
// middleware has to know multipart (or disk storage) was involved — the original upload
// stays on disk under UPLOAD_DIR as the durable copy.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — matches the frontend's own upload limit
const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'procurements');

const FILE_FIELDS: Array<{ field: string; nameKey: string; typeKey: string; dataUrlKey: string }> = [
  { field: 'specFile', nameKey: 'specFileName', typeKey: 'specFileType', dataUrlKey: 'specFileDataUrl' },
  { field: 'invoiceFile', nameKey: 'invoiceFileName', typeKey: 'invoiceFileType', dataUrlKey: 'invoiceFileDataUrl' },
];

// originalname comes straight from the client — strip it down to safe characters before
// it's used as (part of) a path on disk, so a crafted name can't escape UPLOAD_DIR or
// collide with another upload.
function safeFilename(original: string): string {
  const cleaned = original.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-100);
  return `${Date.now()}-${randomUUID()}-${cleaned}`;
}

const upload = multer({
  // destination as a plain string makes multer create UPLOAD_DIR (recursively) itself,
  // and clean up any partially-written file automatically if fileFilter/limits reject it.
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
  }),
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
      const uploaded = FILE_FIELDS.map(({ field, nameKey, typeKey, dataUrlKey }) => files[field]?.[0]
        ? { file: files[field][0], nameKey, typeKey, dataUrlKey }
        : null,
      ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (uploaded.length === 0) {
        next();
        return;
      }

      // With disk storage the file only exists on disk at this point (file.buffer is
      // unset) — read it back to build the inline data URL the rest of the app expects.
      // The file on disk stays put as the durable copy; this read is just to mirror it
      // into the request body.
      Promise.all(
        uploaded.map(async ({ file, nameKey, typeKey, dataUrlKey }) => {
          const buffer = await readFile(file.path);
          (req.body as Record<string, unknown>)[nameKey] = file.originalname;
          (req.body as Record<string, unknown>)[typeKey] = file.mimetype;
          (req.body as Record<string, unknown>)[dataUrlKey] =
            `data:${file.mimetype};base64,${buffer.toString('base64')}`;
        }),
      )
        .then(() => next())
        .catch((readErr: Error) => next(this.reject(req, `Failed to read uploaded file from disk: ${readErr.message}`)));
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
