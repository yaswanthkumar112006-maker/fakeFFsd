import { Injectable } from '@nestjs/common';
import { ResourcesRepo } from './resources.repo';
import { CreateResourcesDto } from './resources.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly repo: ResourcesRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateResourcesDto) {
    return this.repo.create(data);
  }
}
