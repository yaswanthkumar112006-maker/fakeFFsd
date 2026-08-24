import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { DataModule } from '../data/data.module';

@Module({
  imports: [DataModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
