import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { ProcurementRepo } from './procurement.repo';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService, ProcurementRepo],
  exports: [ProcurementService],
})
export class ProcurementModule {}
