import { Injectable } from '@nestjs/common';
import { DepartmentsRepo } from './departments.repo';
import { CreateDepartmentsDto } from './departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repo: DepartmentsRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateDepartmentsDto) {
    return this.repo.create(data);
  }
}
