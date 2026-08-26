import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DepartmentsLoggingMiddleware } from './middleware/departments-logging.middleware';
import {
  DepartmentsRateLimitMiddleware,
  DepartmentsSecurityHeadersMiddleware,
} from './middleware/departments-security.middleware';
import { DepartmentsValidationMiddleware } from './middleware/departments-validation.middleware';
import { DepartmentsFileLoggerService } from './middleware/departments-file-logger';
import { DepartmentsExceptionFilter } from './filters/departments-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsFileLoggerService, DepartmentsExceptionFilter],
  exports: [DepartmentsService],
})
export class DepartmentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        DepartmentsLoggingMiddleware,
        DepartmentsSecurityHeadersMiddleware,
        DepartmentsRateLimitMiddleware,
        DepartmentsValidationMiddleware,
      )
      .forRoutes(DepartmentsController);
  }
}
