import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class DepartmentsRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('departments');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('departments', 'id', id);
  }

  create(data: any) {
    return this.store.create('departments', data);
  }
}
