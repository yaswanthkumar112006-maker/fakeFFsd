import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class AuthRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('users');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('users', 'id', id);
  }

  create(data: any) {
    return this.store.create('users', data);
  }
}
