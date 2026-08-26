import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersLoggingMiddleware } from './middleware/users-logging.middleware';
import {
  UsersRateLimitMiddleware,
  UsersSecurityHeadersMiddleware,
} from './middleware/users-security.middleware';
import { UsersValidationMiddleware } from './middleware/users-validation.middleware';
import { UsersFileLoggerService } from './middleware/users-file-logger';
import { UsersExceptionFilter } from './filters/users-exception.filter';

@Module({
  imports: [DataModule],
  controllers: [UsersController],
  providers: [UsersService, UsersFileLoggerService, UsersExceptionFilter],
  exports: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        UsersLoggingMiddleware,
        UsersSecurityHeadersMiddleware,
        UsersRateLimitMiddleware,
        UsersValidationMiddleware,
      )
      .forRoutes(UsersController);
  }
}
