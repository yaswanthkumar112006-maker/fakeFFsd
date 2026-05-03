import { Injectable } from '@nestjs/common';
import { ReturnsRepo } from './returns.repo';
import { CreateReturnsDto } from './returns.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly repo: ReturnsRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateReturnsDto) {
    return this.repo.create(data);
  }
}
