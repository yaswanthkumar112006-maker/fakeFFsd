import { Module } from '@nestjs/common';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { ReturnsRepo } from './returns.repo';

@Module({
  controllers: [ReturnsController],
  providers: [ReturnsService, ReturnsRepo],
  exports: [ReturnsService],
})
export class ReturnsModule {}
