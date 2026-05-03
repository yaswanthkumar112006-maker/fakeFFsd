import { Injectable } from '@nestjs/common';
import { RolesRepo } from './roles.repo';
import { CreateRolesDto } from './roles.dto';

@Injectable()
export class RolesService {
  constructor(private readonly repo: RolesRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateRolesDto) {
    return this.repo.create(data);
  }
}
