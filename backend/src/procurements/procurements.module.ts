import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ProcurementsController } from './procurements.controller';
import { ProcurementsService } from './procurements.service';
import { ProcurementLoggingMiddleware } from './middleware/procurement-logging.middleware';
import { ProcurementRateLimitMiddleware } from './middleware/procurement-rate-limit.middleware';
import { ProcurementFileValidationMiddleware } from './middleware/procurement-file-validation.middleware';
import { ProcurementFileLoggerService } from './middleware/procurement-file-logger';
import { ProcurementsExceptionFilter } from './filters/procurements-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [ProcurementsController],
  // ProcurementFileLoggerService is the shared singleton every middleware/filter below
  // injects. ProcurementsExceptionFilter is listed here too (not just passed to
  // @UseFilters()) so Nest's DI container can resolve its own constructor dependency.
  providers: [ProcurementsService, ProcurementFileLoggerService, ProcurementsExceptionFilter],
  exports: [ProcurementsService],
})
export class ProcurementsModule implements NestModule {
  // Router-level middleware: scoped to this module's routes only (via forRoutes),
  // not registered globally in main.ts. Order matters — logging goes first so every
  // request is recorded even if a later middleware rejects it; rate-limiting goes
  // before file validation so an abusive caller is turned away before we do any
  // parsing/validation work on their payload.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ProcurementLoggingMiddleware,
        ProcurementRateLimitMiddleware,
        ProcurementFileValidationMiddleware,
      )
      .forRoutes(ProcurementsController);
  }
}
