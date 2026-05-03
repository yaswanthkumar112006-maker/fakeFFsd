import { Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';
import { AllocationsRepo } from './allocations.repo';

@Module({
  controllers: [AllocationsController],
  providers: [AllocationsService, AllocationsRepo],
  exports: [AllocationsService],
})
export class AllocationsModule {}
