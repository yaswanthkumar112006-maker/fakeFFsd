import { Injectable } from '@nestjs/common';
import { ResourceTypesRepo } from './resource-types.repo';
import { CreateResourceTypesDto } from './resource-types.dto';

@Injectable()
export class ResourceTypesService {
  constructor(private readonly repo: ResourceTypesRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateResourceTypesDto) {
    return this.repo.create(data);
  }
}
