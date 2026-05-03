import { Injectable } from '@nestjs/common';
import { ProcurementRepo } from './procurement.repo';
import { CreateProcurementDto } from './procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private readonly repo: ProcurementRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateProcurementDto) {
    return this.repo.create(data);
  }
}
