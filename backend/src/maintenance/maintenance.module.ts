import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { LoggingMiddleware } from '../common/middleware/logging.middleware';
import {
  RateLimitMiddleware,
  SecurityMiddleware,
} from '../common/middleware/security.middleware';
import { MaintenanceRouterMiddleware } from '../common/middleware/maintenance.middleware';
import { singleFileUpload } from '../common/middleware/upload.middleware';
import { ServiceExceptionFilter } from '../common/middleware/error-handling.filter';

@Module({
  imports: [DataModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, ServiceExceptionFilter],
  exports: [MaintenanceService],
})
export class MaintenanceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. Logging     — record every request, including ones rejected further down.
    // 2. Security    — protective headers on every response.
    // 3. Rate limit  — accept/repair/scrap mutate asset state, so throttle bursts.
    consumer
      .apply(LoggingMiddleware, SecurityMiddleware, RateLimitMiddleware)
      .forRoutes(MaintenanceController);

    // 4. File upload — multer, for the optional inspection report or damage photo on
    //    POST /:resourceId/accept | /repair | /scrap.
    //    The path is '*path', not a bare '*': Express 5 / path-to-regexp v8 require
    //    named wildcards, and an unnamed one only survived via a deprecation shim.
    consumer
      .apply(singleFileUpload('report'))
      .forRoutes({ path: 'maintenance/*path', method: RequestMethod.POST });

    // 5. Router-level validation — resourceId format and the accept/repair/scrap action.
    consumer.apply(MaintenanceRouterMiddleware).forRoutes(MaintenanceController);
  }
}
