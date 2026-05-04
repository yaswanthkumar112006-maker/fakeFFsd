import { Injectable } from '@nestjs/common';
import { RequestRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateRequestDto, UpdateRequestDto } from './dto/request.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext, filters?: { status?: string; department?: string }) {
    let items = this.dataService.getCollection('requests', context) as RequestRecord[];
    if (filters?.status && filters.status !== 'All') {
      const statuses = filters.status.split(',').map((value) => value.trim());
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters?.department && filters.department !== 'All') {
      items = items.filter((item) => item.department === filters.department);
    }
    return items;
  }

  create(payload: CreateRequestDto, context: RequestContext): RequestRecord {
    const user = this.dataService.getActingUser(context);
    const department = payload.department || user?.department || 'Unassigned';
    this.dataService.ensureValidDepartmentResourceType(department, payload.resourceType);
    return this.dataService.addRequest({
      ...payload,
      department,
      requestor: payload.requestor || user?.name || 'Unknown User',
      requestorId: payload.requestorId || user?.id,
      status: payload.status || 'Pending',
      date: payload.date || new Date().toLocaleDateString('en-US'),
    });
  }

  update(id: string, payload: UpdateRequestDto): RequestRecord {
    return this.dataService.updateRequest(id, payload);
  }

  approve(id: string) {
    return this.dataService.updateRequest(id, { status: 'Approved' });
  }

  reject(id: string) {
    return this.dataService.updateRequest(id, { status: 'Rejected' });
  }

  allocate(id: string, resourceIds: string[], context: RequestContext) {
    return this.dataService.allocateRequest(id, resourceIds, context);
  }

  confirmReceipt(id: string, context: RequestContext) {
    return this.dataService.confirmReceipt(id, context);
  }
}
