import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ResourceTypesRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('resource_types');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('resource_types', 'id', id);
  }

  create(data: any) {
    return this.store.create('resource_types', data);
  }
}
