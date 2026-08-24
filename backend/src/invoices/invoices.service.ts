import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { InvoiceRecord } from '../common/domain';

@Injectable()
export class InvoicesService {
  constructor(private readonly dataService: DataService) {}

  getAll(): InvoiceRecord[] {
    return this.dataService.getInvoices();
  }
}
