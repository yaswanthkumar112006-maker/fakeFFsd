import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsRepo } from './requests.repo';

@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestsRepo],
  exports: [RequestsService],
})
export class RequestsModule {}
