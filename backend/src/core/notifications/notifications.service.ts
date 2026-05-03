import { Injectable } from '@nestjs/common';
import { NotificationsRepo } from './notifications.repo';
import { CreateNotificationsDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateNotificationsDto) {
    return this.repo.create(data);
  }
}
