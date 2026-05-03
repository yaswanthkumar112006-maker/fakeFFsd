import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRepo } from './maintenance.repo';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepo],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
