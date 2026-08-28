import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { DataModule } from '../data/data.module';
import { InvoicesLoggingMiddleware } from './middleware/invoices-logging.middleware';
import {
  InvoicesRateLimitMiddleware,
  InvoicesSecurityHeadersMiddleware,
} from './middleware/invoices-security.middleware';
import { InvoicesFileLoggerService } from './middleware/invoices-file-logger';
import { InvoicesExceptionFilter } from './filters/invoices-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [InvoicesController],
  // InvoicesFileLoggerService is the shared singleton every middleware/filter below
  // injects. InvoicesExceptionFilter is listed here too (not just passed to
  // @UseFilters()) so Nest's DI container can resolve its own constructor dependency.
  providers: [InvoicesService, InvoicesFileLoggerService, InvoicesExceptionFilter],
})
export class InvoicesModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally. Order matters — logging goes first so every request is
  // recorded even if a later middleware rejects it; security headers apply to every
  // response; rate-limiting turns away abusive callers last. No dedicated validation
  // middleware here — the module's only route (GET /) takes no body, params, or
  // query, so there's nothing to validate.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(InvoicesLoggingMiddleware, InvoicesSecurityHeadersMiddleware, InvoicesRateLimitMiddleware)
      .forRoutes(InvoicesController);
  }
}
