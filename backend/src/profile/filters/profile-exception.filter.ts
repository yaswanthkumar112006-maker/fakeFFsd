import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProfileFileLoggerService } from '../middleware/profile-file-logger';

// Error-handling filter for the Profile module, applied via @UseFilters() on
// ProfileController only. Catches everything thrown while handling a
// profile request, logs it to a file, and returns one consistent JSON error shape.
@Injectable()
@Catch()
export class ProfileExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProfileErrors');

  constructor(private readonly fileLogger: ProfileFileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawMessage = isHttpException
      ? exception.getResponse()
      : (exception as Error)?.message || 'Unexpected error';
    const message =
      typeof rawMessage === 'string' ? rawMessage : (rawMessage as any)?.message || rawMessage;

    const context = (request as any).context || {};
    const stack = !isHttpException && exception instanceof Error ? exception.stack : undefined;

    const logLine = [
      new Date().toISOString(),
      'ERROR',
      request.method,
      request.originalUrl || request.url,
      status,
      `role=${context.role || 'unknown'}`,
      `user=${context.userId || 'anonymous'}`,
      Array.isArray(message) ? message.join('; ') : message,
    ].join(' | ');

    if (status >= 500) this.logger.error(logLine, stack);
    else this.logger.warn(logLine);
    this.fileLogger.logError(stack ? `${logLine}\n${stack}` : logLine);

    response.status(status).json({
      statusCode: status,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
