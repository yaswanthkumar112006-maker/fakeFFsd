import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ReturnsRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('return_requests');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('return_requests', 'id', id);
  }

  create(data: any) {
    return this.store.create('return_requests', data);
  }
}
