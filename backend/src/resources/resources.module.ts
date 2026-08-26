import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourcesLoggingMiddleware } from './middleware/resources-logging.middleware';
import {
  ResourcesRateLimitMiddleware,
  ResourcesSecurityHeadersMiddleware,
} from './middleware/resources-security.middleware';
import { ResourcesValidationMiddleware } from './middleware/resources-validation.middleware';
import { ResourcesFileLoggerService } from './middleware/resources-file-logger';
import { ResourcesExceptionFilter } from './filters/resources-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourcesFileLoggerService, ResourcesExceptionFilter],
  exports: [ResourcesService],
})
export class ResourcesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ResourcesLoggingMiddleware,
        ResourcesSecurityHeadersMiddleware,
        ResourcesRateLimitMiddleware,
        ResourcesValidationMiddleware,
      )
      .forRoutes(ResourcesController);
  }
}
