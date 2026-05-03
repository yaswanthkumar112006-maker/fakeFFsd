import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class RolesRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('roles');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('roles', 'id', id);
  }

  create(data: any) {
    return this.store.create('roles', data);
  }
}
