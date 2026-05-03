import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class MaintenanceRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('maintenance_requests');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('maintenance_requests', 'id', id);
  }

  create(data: any) {
    return this.store.create('maintenance_requests', data);
  }
}
