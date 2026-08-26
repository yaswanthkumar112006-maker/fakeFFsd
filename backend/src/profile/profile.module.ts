import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileLoggingMiddleware } from './middleware/profile-logging.middleware';
import {
  ProfileRateLimitMiddleware,
  ProfileSecurityHeadersMiddleware,
} from './middleware/profile-security.middleware';
import { ProfileValidationMiddleware } from './middleware/profile-validation.middleware';
import { ProfileFileLoggerService } from './middleware/profile-file-logger';
import { ProfileExceptionFilter } from './filters/profile-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileFileLoggerService, ProfileExceptionFilter],
  exports: [ProfileService],
})
export class ProfileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ProfileLoggingMiddleware,
        ProfileSecurityHeadersMiddleware,
        ProfileRateLimitMiddleware,
        ProfileValidationMiddleware,
      )
      .forRoutes(ProfileController);
  }
}
