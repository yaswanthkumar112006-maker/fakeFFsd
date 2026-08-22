import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { ResourceRecord, MaintenanceHistoryRecord } from '../common/domain';
import { getActingUser, ensureDepartmentScoped } from '../common/utils';

@Injectable()
export class MaintenanceService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext): MaintenanceHistoryRecord[] {
    const user = getActingUser(this.dataService, context);
    const history = this.dataService.getMaintenanceHistory();

    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return history;
    }

    return history.filter(
      (item) => item.department === user?.department || item.allocatedTo === user?.name
    );
  }

  accept(resourceId: string, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Maintenance Requested') {
      throw new BadRequestException('Only maintenance-requested resources can be accepted.');
    }

    return this.dataService.updateResource(resourceId, { status: 'Maintenance' });
  }

  private resolve(resourceId: string, status: 'Repaired' | 'Scrapped', context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (!['Maintenance Requested', 'Maintenance'].includes(resource.status)) {
      throw new BadRequestException('Only active maintenance items can be resolved.');
    }

    const finalStatus = status === 'Repaired' ? 'Repaired' : 'Scrapped';
    const finalCondition = status === 'Repaired' ? 'Good' : resource.condition;

    // Log the maintenance action
    this.dataService.insertMaintenanceHistory({
      code: resource.id,
      type: resource.type,
      department: resource.department,
      allocatedTo: resource.assignedTo,
      issue: status === 'Repaired' ? 'Repaired' : 'Unrepairable',
      actionDate: new Date().toLocaleDateString('en-US'),
      status: status === 'Repaired' ? 'Repaired' : 'Scrap',
    });

    // Update resource state
    return this.dataService.updateResource(resourceId, {
      status: finalStatus,
      condition: finalCondition,
    });
  }

  repair(resourceId: string, context: RequestContext): ResourceRecord {
    return this.resolve(resourceId, 'Repaired', context);
  }

  scrap(resourceId: string, context: RequestContext): ResourceRecord {
    return this.resolve(resourceId, 'Scrapped', context);
  }
}
