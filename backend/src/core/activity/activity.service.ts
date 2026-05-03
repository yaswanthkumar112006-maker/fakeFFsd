import { Injectable } from '@nestjs/common';
import { ActivityRepo } from './activity.repo';
import { CreateActivityDto } from './activity.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly repo: ActivityRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateActivityDto) {
    return this.repo.create(data);
  }
}
