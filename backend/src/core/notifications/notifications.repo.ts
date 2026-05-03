import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class NotificationsRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('notifications');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('notifications', 'id', id);
  }

  create(data: any) {
    return this.store.create('notifications', data);
  }
}
