import { Injectable } from '@nestjs/common';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';

@Injectable()
export class MaintenanceService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext) {
    return this.dataService.getCollection('maintenanceHistory', context);
  }

  accept(resourceId: string, context: RequestContext) {
    return this.dataService.acceptMaintenance(resourceId, context);
  }

  repair(resourceId: string, context: RequestContext) {
    return this.dataService.resolveMaintenance(resourceId, 'Repaired', context);
  }

  scrap(resourceId: string, context: RequestContext) {
    return this.dataService.resolveMaintenance(resourceId, 'Scrapped', context);
  }
}
