import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsLoggingMiddleware } from './middleware/permissions-logging.middleware';
import {
  PermissionsRateLimitMiddleware,
  PermissionsSecurityHeadersMiddleware,
} from './middleware/permissions-security.middleware';
import { PermissionsValidationMiddleware } from './middleware/permissions-validation.middleware';
import { PermissionsFileLoggerService } from './middleware/permissions-file-logger';
import { PermissionsExceptionFilter } from './filters/permissions-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [PermissionsController],
  // PermissionsFileLoggerService is the shared singleton every middleware/filter
  // below injects. PermissionsExceptionFilter is listed here too (not just passed
  // to @UseFilters()) so Nest's DI container can resolve its own constructor
  // dependency.
  providers: [PermissionsService, PermissionsFileLoggerService, PermissionsExceptionFilter],
  exports: [PermissionsService],
})
export class PermissionsModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally. Order matters — logging goes first so every request is
  // recorded even if a later middleware rejects it; security headers apply to every
  // response; rate-limiting turns away abusive callers before validation work runs.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        PermissionsLoggingMiddleware,
        PermissionsSecurityHeadersMiddleware,
        PermissionsRateLimitMiddleware,
        PermissionsValidationMiddleware,
      )
      .forRoutes(PermissionsController);
  }
}
