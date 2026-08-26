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
import { RequestsFileLoggerService } from '../middleware/requests-file-logger';

// Error-handling filter for the Requests module, applied via @UseFilters() on
// RequestsController only (not globally). Catches everything thrown while
// handling a resource request — validation errors, workflow-state errors (e.g.
// "can only approve a pending request"), and unexpected exceptions — logs
// each to a file, and returns one consistent JSON error shape.
//
// @Injectable() here is what lets Nest's DI container construct this filter
// (rather than a bare `new RequestsExceptionFilter()`) when it's registered as
// a class via @UseFilters(), so the shared file-logger can be constructor-
// injected into it just like into the middleware classes above.
@Injectable()
@Catch()
export class RequestsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('RequestsErrors');

  constructor(private readonly fileLogger: RequestsFileLoggerService) {}

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
