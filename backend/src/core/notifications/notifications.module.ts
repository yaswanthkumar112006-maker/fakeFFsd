import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepo } from './notifications.repo';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepo],
  exports: [NotificationsService],
})
export class NotificationsModule {}
