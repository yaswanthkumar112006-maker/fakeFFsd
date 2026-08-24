import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [DataModule],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
