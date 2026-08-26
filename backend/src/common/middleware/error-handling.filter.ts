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
import { ServiceFileLoggerService } from './service-file-logger';

interface NormalizedError {
  status: number;
  message: string;
  stack?: string;
}

/** Pull a status, a flat message and (for unexpected errors) a stack out of anything thrown. */
function normalize(exception: unknown): NormalizedError {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'string') return { status, message: body };

    if (typeof body === 'object' && body !== null) {
      const raw = (body as any).message;
      // ValidationPipe reports an array of messages — flatten it into one line.
      if (Array.isArray(raw)) return { status, message: raw.join(', ') };
      if (typeof raw === 'string') return { status, message: raw };
      return { status, message: JSON.stringify(body) };
    }

    return { status, message: exception.message };
  }

  if (exception instanceof Error) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Something went wrong',
      stack: exception.stack,
    };
  }

  return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Something went wrong' };
}

function buildLogLine(request: Request, status: number, message: string): string {
  const context = (request as any).context || {};
  return [
    new Date().toISOString(),
    'ERROR',
    request.method,
    request.originalUrl || request.url,
    status,
    `role=${context.role || 'anonymous'}`,
    `user=${context.userId || 'anonymous'}`,
    message,
  ].join(' | ');
}

/**
 * Error-handling middleware, registered globally in main.ts.
 *
 * Catches everything thrown while handling a request, records it to logs/error.log
 * through the buffered logger, and returns one consistent JSON shape. Internal
 * errors are logged in full but reported to the client generically, so stack
 * details and internal messages never leak.
 *
 * This filter — not the controller-scoped ServiceExceptionFilter below — is what
 * handles exceptions thrown by the router-level middleware: middleware runs before
 * Nest resolves the controller, so a @UseFilters() filter isn't in scope yet. It
 * therefore applies the same service tag, so a validation rejection from middleware
 * and a failure from inside a service produce the same payload shape.
 */
@Catch()
export class CentralErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('AppErrors');

  // Constructed with `new` in main.ts, outside the DI container, so it reaches for
  // the shared logger instance directly instead of taking it via the constructor.
  private readonly fileLogger = ServiceFileLoggerService.getShared();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, stack } = normalize(exception);
    const service = resolveService(request);
    const logLine =
      service === 'unknown'
        ? buildLogLine(request, status, message)
        : `${buildLogLine(request, status, message)} | service=${service}`;

    if (status >= 500) this.logger.error(logLine, stack);
    else this.logger.warn(logLine);
    this.fileLogger.logError(stack ? `${logLine}\n${stack}` : logLine);

    // If something already started the response (e.g. a stream), let Express finish it.
    if (response.headersSent) return;

    response.status(status).json({
      success: false,
      statusCode: status,
      // Only tagged for the three services this middleware suite covers; other
      // routes across the app keep the plain payload they had before.
      ...(service === 'unknown' ? {} : { service }),
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Something went wrong' : message,
    });
  }
}

/**
 * Error-handling middleware scoped to the Support / Communications / Maintenance
 * controllers, applied with @UseFilters(). Controller-level filters take precedence
 * over the global one, so these routes get an error payload tagged with the service
 * that produced it, which makes the shared logs/error.log easy to filter by area.
 *
 * @Injectable() is what lets Nest construct it through the DI container when it is
 * registered as a class, so the shared file logger can be constructor-injected.
 */
@Injectable()
@Catch()
export class ServiceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ServicesErrors');

  constructor(private readonly fileLogger: ServiceFileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, stack } = normalize(exception);
    const service = resolveService(request);
    const logLine = `${buildLogLine(request, status, message)} | service=${service}`;

    if (status >= 500) this.logger.error(logLine, stack);
    else this.logger.warn(logLine);
    this.fileLogger.logError(stack ? `${logLine}\n${stack}` : logLine);

    if (response.headersSent) return;

    response.status(status).json({
      success: false,
      statusCode: status,
      service,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Something went wrong' : message,
    });
  }
}

function resolveService(request: Request): string {
  const url = request.originalUrl || request.url || '';
  if (url.includes('/support')) return 'support';
  if (url.includes('/announcements')) return 'communications';
  if (url.includes('/maintenance')) return 'maintenance';
  return 'unknown';
}
