import { Injectable } from '@nestjs/common';
import { RequestsRepo } from './requests.repo';
import { CreateRequestsDto } from './requests.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly repo: RequestsRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateRequestsDto) {
    return this.repo.create(data);
  }
}
