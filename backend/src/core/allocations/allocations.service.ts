import { Injectable } from '@nestjs/common';
import { AllocationsRepo } from './allocations.repo';
import { CreateAllocationsDto } from './allocations.dto';

@Injectable()
export class AllocationsService {
  constructor(private readonly repo: AllocationsRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateAllocationsDto) {
    return this.repo.create(data);
  }
}
