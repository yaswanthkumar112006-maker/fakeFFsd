import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { DataModule } from '../data/data.module';
import { LoggingMiddleware } from '../common/middleware/logging.middleware';
import {
  RateLimitMiddleware,
  SecurityMiddleware,
} from '../common/middleware/security.middleware';
import { CommunicationsRouterMiddleware } from '../common/middleware/communications.middleware';
import { singleFileUpload } from '../common/middleware/upload.middleware';
import { ServiceExceptionFilter } from '../common/middleware/error-handling.filter';

@Module({
  imports: [DataModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, ServiceExceptionFilter],
})
export class AnnouncementsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. Logging     — record every request, including ones rejected further down.
    // 2. Security    — protective headers on every response.
    // 3. Rate limit  — a broadcast fans out to every org, so throttle repeat sends.
    consumer
      .apply(LoggingMiddleware, SecurityMiddleware, RateLimitMiddleware)
      .forRoutes(AnnouncementsController);

    // 4. File upload — multer, for an optional attachment on a broadcast
    //    (e.g. a policy PDF). Registered before the validator so req.body is
    //    populated for multipart/form-data too.
    consumer
      .apply(singleFileUpload('attachment'))
      .forRoutes({ path: 'announcements', method: RequestMethod.POST });

    // 5. Router-level validation — title/message/type/targetOrgId on POST,
    //    and the reply body on PATCH /api/announcements/:id/reply.
    consumer.apply(CommunicationsRouterMiddleware).forRoutes(AnnouncementsController);
  }
}
