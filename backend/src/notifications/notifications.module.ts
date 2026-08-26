import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsLoggingMiddleware } from './middleware/notifications-logging.middleware';
import {
  NotificationsRateLimitMiddleware,
  NotificationsSecurityHeadersMiddleware,
} from './middleware/notifications-security.middleware';
import { NotificationsValidationMiddleware } from './middleware/notifications-validation.middleware';
import { NotificationsFileLoggerService } from './middleware/notifications-file-logger';
import { NotificationsExceptionFilter } from './filters/notifications-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsFileLoggerService, NotificationsExceptionFilter],
  exports: [NotificationsService],
})
export class NotificationsModule implements NestModule {
  // No file-upload middleware here — notifications never carry an attachment
  // (UpdateNotificationDto is just an optional `read` boolean).
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        NotificationsLoggingMiddleware,
        NotificationsSecurityHeadersMiddleware,
        NotificationsRateLimitMiddleware,
        NotificationsValidationMiddleware,
      )
      .forRoutes(NotificationsController);
  }
}
