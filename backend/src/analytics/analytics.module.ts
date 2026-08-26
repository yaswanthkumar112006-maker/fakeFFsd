import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsLoggingMiddleware } from './middleware/analytics-logging.middleware';
import {
  AnalyticsRateLimitMiddleware,
  AnalyticsSecurityHeadersMiddleware,
} from './middleware/analytics-security.middleware';
import { AnalyticsValidationMiddleware } from './middleware/analytics-validation.middleware';
import { AnalyticsFileLoggerService } from './middleware/analytics-file-logger';
import { AnalyticsExceptionFilter } from './filters/analytics-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsFileLoggerService, AnalyticsExceptionFilter],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements NestModule {
  // No file-upload middleware — nothing in this module ever accepts a file.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        AnalyticsLoggingMiddleware,
        AnalyticsSecurityHeadersMiddleware,
        AnalyticsRateLimitMiddleware,
        AnalyticsValidationMiddleware,
      )
      .forRoutes(AnalyticsController);
  }
}
