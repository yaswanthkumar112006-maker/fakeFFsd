import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceLoggingMiddleware } from './middleware/maintenance-logging.middleware';
import {
  MaintenanceRateLimitMiddleware,
  MaintenanceSecurityHeadersMiddleware,
} from './middleware/maintenance-security.middleware';
import { MaintenanceValidationMiddleware } from './middleware/maintenance-validation.middleware';
import { MaintenanceFileLoggerService } from './middleware/maintenance-file-logger';
import { MaintenanceExceptionFilter } from './filters/maintenance-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceFileLoggerService, MaintenanceExceptionFilter],
  exports: [MaintenanceService],
})
export class MaintenanceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. Logging     — record every request, including ones rejected further down.
    // 2. Security    — protective headers on every response.
    // 3. Rate limit  — accept/repair/scrap mutate asset state, so throttle bursts.
    // 4. Validation  — resourceId format and the accept/repair/scrap action.
    consumer
      .apply(
        MaintenanceLoggingMiddleware,
        MaintenanceSecurityHeadersMiddleware,
        MaintenanceRateLimitMiddleware,
        MaintenanceValidationMiddleware,
      )
      .forRoutes(MaintenanceController);
  }
}
