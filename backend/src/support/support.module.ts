import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { DataModule } from '../data/data.module';
import { SupportLoggingMiddleware } from './middleware/support-logging.middleware';
import {
  SupportRateLimitMiddleware,
  SupportSecurityHeadersMiddleware,
} from './middleware/support-security.middleware';
import { SupportValidationMiddleware } from './middleware/support-validation.middleware';
import { SupportFileLoggerService } from './middleware/support-file-logger';
import { SupportExceptionFilter } from './filters/support-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [SupportController],
  // SupportFileLoggerService is the shared singleton every middleware/filter below
  // injects. SupportExceptionFilter is listed here too (not just passed to
  // @UseFilters()) so Nest's DI container can resolve its own constructor dependency.
  providers: [SupportService, SupportFileLoggerService, SupportExceptionFilter],
})
export class SupportModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally. Order matters — logging goes first so every request is
  // recorded even if a later middleware rejects it; security headers apply to every
  // response; rate-limiting turns away abusive callers before validation work runs.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SupportLoggingMiddleware,
        SupportSecurityHeadersMiddleware,
        SupportRateLimitMiddleware,
        SupportValidationMiddleware,
      )
      .forRoutes(SupportController);
  }
}
