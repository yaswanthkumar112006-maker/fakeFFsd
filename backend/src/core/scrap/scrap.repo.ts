import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ScrapRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('scrap_resources');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('scrap_resources', 'id', id);
  }

  create(data: any) {
    return this.store.create('scrap_resources', data);
  }
}
