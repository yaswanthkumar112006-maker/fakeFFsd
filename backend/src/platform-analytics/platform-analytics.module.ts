import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PlatformAnalyticsController } from './platform-analytics.controller';
import { DataModule } from '../data/data.module';
import { PlatformAnalyticsLoggingMiddleware } from './middleware/platform-analytics-logging.middleware';
import {
  PlatformAnalyticsRateLimitMiddleware,
  PlatformAnalyticsSecurityHeadersMiddleware,
} from './middleware/platform-analytics-security.middleware';
import { PlatformAnalyticsFileLoggerService } from './middleware/platform-analytics-file-logger';
import { PlatformAnalyticsExceptionFilter } from './filters/platform-analytics-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [PlatformAnalyticsController],
  providers: [
    PlatformAnalyticsService,
    PlatformAnalyticsFileLoggerService,
    PlatformAnalyticsExceptionFilter,
  ],
})
export class PlatformAnalyticsModule implements NestModule {
  // No file-upload middleware (this module never accepts a body at all) and no
  // validation middleware — the single route (GET, Owner-only, no params/body) has
  // nothing to validate.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        PlatformAnalyticsLoggingMiddleware,
        PlatformAnalyticsSecurityHeadersMiddleware,
        PlatformAnalyticsRateLimitMiddleware,
      )
      .forRoutes(PlatformAnalyticsController);
  }
}
