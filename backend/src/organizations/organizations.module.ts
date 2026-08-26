import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationsLoggingMiddleware } from './middleware/organizations-logging.middleware';
import {
  OrganizationsRateLimitMiddleware,
  OrganizationsSecurityHeadersMiddleware,
} from './middleware/organizations-security.middleware';
import { OrganizationsValidationMiddleware } from './middleware/organizations-validation.middleware';
import { OrganizationsFileLoggerService } from './middleware/organizations-file-logger';
import { OrganizationsExceptionFilter } from './filters/organizations-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsFileLoggerService, OrganizationsExceptionFilter],
})
export class OrganizationsModule implements NestModule {
  // No file-upload middleware — RegisterOrgDto and every PATCH body here are plain
  // text/id fields, nothing file-shaped.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        OrganizationsLoggingMiddleware,
        OrganizationsSecurityHeadersMiddleware,
        OrganizationsRateLimitMiddleware,
        OrganizationsValidationMiddleware,
      )
      .forRoutes(OrganizationsController);
  }
}
