import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ProcurementsController } from './procurements.controller';
import { ProcurementsService } from './procurements.service';

@Module({
  imports: [DataModule],
  controllers: [ProcurementsController],
  providers: [ProcurementsService],
  exports: [ProcurementsService],
})
export class ProcurementsModule {}
