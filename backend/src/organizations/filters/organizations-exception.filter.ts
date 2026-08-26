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
import { OrganizationsFileLoggerService } from '../middleware/organizations-file-logger';

// Error-handling filter for the Organizations module, applied via @UseFilters() on
// OrganizationsController only (not globally).
@Injectable()
@Catch()
export class OrganizationsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('OrganizationsErrors');

  constructor(private readonly fileLogger: OrganizationsFileLoggerService) {}

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
      request.originalUrl,
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
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
