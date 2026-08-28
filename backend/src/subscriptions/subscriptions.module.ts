import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsLoggingMiddleware } from './middleware/subscriptions-logging.middleware';
import {
  SubscriptionsRateLimitMiddleware,
  SubscriptionsSecurityHeadersMiddleware,
} from './middleware/subscriptions-security.middleware';
import { SubscriptionsFileLoggerService } from './middleware/subscriptions-file-logger';
import { SubscriptionsExceptionFilter } from './filters/subscriptions-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [SubscriptionsController],
  // SubscriptionsFileLoggerService is the shared singleton every middleware/filter
  // below injects. SubscriptionsExceptionFilter is listed here too (not just passed
  // to @UseFilters()) so Nest's DI container can resolve its own constructor
  // dependency.
  providers: [SubscriptionsFileLoggerService, SubscriptionsExceptionFilter],
})
export class SubscriptionsModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally. Order matters — logging goes first so every request is
  // recorded even if a later middleware rejects it; security headers apply to every
  // response; rate-limiting turns away abusive callers last. No dedicated validation
  // middleware here — the module's only route (GET /plans) takes no body, params, or
  // query, so there's nothing to validate.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubscriptionsLoggingMiddleware, SubscriptionsSecurityHeadersMiddleware, SubscriptionsRateLimitMiddleware)
      .forRoutes(SubscriptionsController);
  }
}
