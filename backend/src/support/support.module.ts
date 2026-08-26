import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { DataModule } from '../data/data.module';
import { LoggingMiddleware } from '../common/middleware/logging.middleware';
import {
  RateLimitMiddleware,
  SecurityMiddleware,
} from '../common/middleware/security.middleware';
import { SupportRouterMiddleware } from '../common/middleware/support.middleware';
import { singleFileUpload } from '../common/middleware/upload.middleware';
import { ServiceExceptionFilter } from '../common/middleware/error-handling.filter';

@Module({
  imports: [DataModule],
  controllers: [SupportController],
  // ServiceExceptionFilter is listed as a provider (not only passed to @UseFilters
  // on the controller) so Nest's DI container can resolve its file-logger dependency.
  providers: [SupportService, ServiceExceptionFilter],
})
export class SupportModule implements NestModule {
  // Router-level middleware: scoped to this module's routes via forRoutes, not
  // registered globally in main.ts. Order is deliberate — see the comments below.
  configure(consumer: MiddlewareConsumer) {
    // 1. Logging     — record every request, including ones rejected further down.
    // 2. Security    — protective headers on every response.
    // 3. Rate limit  — turn abusive callers away before doing any parsing work.
    consumer
      .apply(LoggingMiddleware, SecurityMiddleware, RateLimitMiddleware)
      .forRoutes(SupportController);

    // 4. File upload — multer, for the optional attachment on POST /api/support.
    //    Registered before the validator so that req.body is populated for
    //    multipart/form-data too, letting step 5 validate JSON and multipart alike.
    consumer
      .apply(singleFileUpload('attachment'))
      .forRoutes({ path: 'support', method: RequestMethod.POST });

    // 5. Router-level validation — POST body fields, and the reply/status pair on
    //    PATCH /api/support/:id/resolve.
    consumer.apply(SupportRouterMiddleware).forRoutes(SupportController);
  }
}
