import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ProcurementRepo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('procurement_requests');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('procurement_requests', 'id', id);
  }

  create(data: any) {
    return this.store.create('procurement_requests', data);
  }
}
