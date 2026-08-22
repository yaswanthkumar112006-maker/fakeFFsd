import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ResourceCondition, ResourceRecord, ReturnHistoryRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { getActingUser, ensureDepartmentScoped } from '../common/utils';

@Injectable()
export class ReturnsService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext): ReturnHistoryRecord[] {
    const user = getActingUser(this.dataService, context);
    const history = this.dataService.getReturnHistory();

    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return history;
    }

    return history.filter(
      (item) => item.department === user?.department || item.returnedBy === user?.name
    );
  }

  process(resourceId: string, condition: ResourceCondition, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Returned') {
      throw new BadRequestException('Can only process returned resources.');
    }

    const finalStatus = condition === 'Damaged' || condition === 'Bad' ? 'Scrapped' : 'Available';

    // Insert log into return history
    this.dataService.insertReturnHistory({
      code: resource.id,
      type: resource.type,
      returnedBy: resource.assignedTo || 'Unknown',
      returnDate: new Date().toLocaleDateString('en-US'),
      processDate: new Date().toLocaleDateString('en-US'),
      condition,
      finalStatus,
      department: resource.department,
    });

    // Update resource state
    return this.dataService.updateResource(resourceId, {
      status: finalStatus,
      condition,
      assignedTo: 'None',
    });
  }
}
