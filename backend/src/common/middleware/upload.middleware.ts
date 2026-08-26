import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function ensureUploadsDirExists() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDirExists();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // path.basename strips any directory component a client tries to smuggle in
    // (e.g. "../../etc/passwd"), and the character filter removes the rest.
    const sanitizedOriginalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(sanitizedOriginalName).toLowerCase();
    const baseName = path.basename(sanitizedOriginalName, ext) || 'upload';
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Both the extension and the declared MIME type have to be on the allow-list —
  // checking only one lets through a .exe renamed to .pdf (or the reverse).
  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported file type: ${ext || file.originalname}. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`,
      ) as any,
      false,
    );
  }
};

export const multerOptions = {
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
  fileFilter,
};

export const uploadMiddleware = multer(multerOptions);

/**
 * Wraps a multer handler so its internal errors become proper HTTP responses.
 *
 * Multer reports limit violations by calling next(MulterError). A MulterError is
 * not an HttpException, so without this wrapper an oversized upload surfaced as a
 * generic 500 "Something went wrong" instead of a 413 telling the caller what was
 * wrong. Errors raised by fileFilter are already HttpExceptions and pass straight through.
 */
export function handleUpload(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err: any) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return next(
              new PayloadTooLargeException(
                `File is too large. Maximum upload size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
              ),
            );
          case 'LIMIT_FILE_COUNT':
            return next(new BadRequestException('Too many files uploaded at once.'));
          case 'LIMIT_UNEXPECTED_FILE':
            return next(
              new BadRequestException(
                `Unexpected file field "${err.field}". Check the form field name.`,
              ),
            );
          default:
            return next(new BadRequestException(`File upload failed: ${err.message}`));
        }
      }

      return next(err);
    });
  };
}

/** File upload middleware for a single optional attachment on the given field. */
export function singleFileUpload(field: string): RequestHandler {
  return handleUpload(uploadMiddleware.single(field));
}
