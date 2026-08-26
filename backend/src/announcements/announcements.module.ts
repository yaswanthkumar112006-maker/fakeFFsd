import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { DataModule } from '../data/data.module';
import { CommunicationsLoggingMiddleware } from './middleware/communications-logging.middleware';
import {
  CommunicationsRateLimitMiddleware,
  CommunicationsSecurityHeadersMiddleware,
} from './middleware/communications-security.middleware';
import { CommunicationsValidationMiddleware } from './middleware/communications-validation.middleware';
import { CommunicationsFileLoggerService } from './middleware/communications-file-logger';
import { CommunicationsExceptionFilter } from './filters/communications-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, CommunicationsFileLoggerService, CommunicationsExceptionFilter],
})
export class AnnouncementsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. Logging     — record every request, including ones rejected further down.
    // 2. Security    — protective headers on every response.
    // 3. Rate limit  — a broadcast fans out to every org, so throttle repeat sends.
    // 4. Validation  — title/message/type/targetOrgId on POST, reply body on PATCH.
    consumer
      .apply(
        CommunicationsLoggingMiddleware,
        CommunicationsSecurityHeadersMiddleware,
        CommunicationsRateLimitMiddleware,
        CommunicationsValidationMiddleware,
      )
      .forRoutes(AnnouncementsController);
  }
}
