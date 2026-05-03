import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ActivityRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('activity_history');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('activity_history', 'id', id);
  }

  create(data: any) {
    return this.store.create('activity_history', data);
  }
}
