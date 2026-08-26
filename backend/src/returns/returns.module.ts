import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { ReturnsLoggingMiddleware } from './middleware/returns-logging.middleware';
import {
  ReturnsRateLimitMiddleware,
  ReturnsSecurityHeadersMiddleware,
} from './middleware/returns-security.middleware';
import { ReturnsValidationMiddleware } from './middleware/returns-validation.middleware';
import { ReturnsFileLoggerService } from './middleware/returns-file-logger';
import { ReturnsExceptionFilter } from './filters/returns-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [ReturnsController],
  // ReturnsFileLoggerService is the shared singleton every middleware/filter below
  // injects. ReturnsExceptionFilter is listed here too (not just passed to
  // @UseFilters()) so Nest's DI container can resolve its own constructor dependency.
  providers: [ReturnsService, ReturnsFileLoggerService, ReturnsExceptionFilter],
  exports: [ReturnsService],
})
export class ReturnsModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally in main.ts. Order matters — logging goes first so every
  // request is recorded even if a later middleware rejects it; rate-limiting goes
  // before validation so an abusive caller is turned away before we do any
  // parsing/validation work on their payload.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ReturnsLoggingMiddleware,
        ReturnsSecurityHeadersMiddleware,
        ReturnsRateLimitMiddleware,
        ReturnsValidationMiddleware,
      )
      .forRoutes(ReturnsController);
  }
}
