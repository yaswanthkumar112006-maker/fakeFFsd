import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsLoggingMiddleware } from './middleware/requests-logging.middleware';
import {
  RequestsRateLimitMiddleware,
  RequestsSecurityHeadersMiddleware,
} from './middleware/requests-security.middleware';
import { RequestsValidationMiddleware } from './middleware/requests-validation.middleware';
import { RequestsFileLoggerService } from './middleware/requests-file-logger';
import { RequestsExceptionFilter } from './filters/requests-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [RequestsController],
  // RequestsFileLoggerService is the shared singleton every middleware/filter below
  // injects. RequestsExceptionFilter is listed here too (not just passed to
  // @UseFilters()) so Nest's DI container can resolve its own constructor dependency.
  providers: [RequestsService, RequestsFileLoggerService, RequestsExceptionFilter],
  exports: [RequestsService],
})
export class RequestsModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally in main.ts. Order matters — logging goes first so every
  // request is recorded even if a later middleware rejects it; rate-limiting goes
  // before validation so an abusive caller is turned away before we do any
  // parsing/validation work on their payload.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestsLoggingMiddleware,
        RequestsSecurityHeadersMiddleware,
        RequestsRateLimitMiddleware,
        RequestsValidationMiddleware,
      )
      .forRoutes(RequestsController);
  }
}
