import { Injectable } from '@nestjs/common';
import { MaintenanceRepo } from './maintenance.repo';
import { CreateMaintenanceDto } from './maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly repo: MaintenanceRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateMaintenanceDto) {
    return this.repo.create(data);
  }
}
