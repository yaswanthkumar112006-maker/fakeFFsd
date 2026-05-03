import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityRepo } from './activity.repo';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepo],
  exports: [ActivityService],
})
export class ActivityModule {}
