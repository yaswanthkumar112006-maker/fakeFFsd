import { Module } from '@nestjs/common';
import { ScrapController } from './scrap.controller';
import { ScrapService } from './scrap.service';
import { ScrapRepo } from './scrap.repo';

@Module({
  controllers: [ScrapController],
  providers: [ScrapService, ScrapRepo],
  exports: [ScrapService],
})
export class ScrapModule {}
