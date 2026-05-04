import { Injectable } from '@nestjs/common';
import { DepartmentResourceCatalogRecord, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext, filters?: { status?: string; department?: string; type?: string; assignedToId?: string }) {
    let items = this.dataService.getCollection('resources', context) as ResourceRecord[];
    if (filters?.status && filters.status !== 'All') {
      const statuses = filters.status.split(',').map((value) => value.trim());
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters?.department && filters.department !== 'All') {
      items = items.filter((item) => item.department === filters.department);
    }
    if (filters?.type) {
      items = items.filter((item) => this.dataService.resourceMatchesType(item, filters.type!));
    }
    if (filters?.assignedToId) {
      items = items.filter((item) => item.assignedToId === filters.assignedToId);
    }
    return items;
  }

  getCatalog(department?: string): DepartmentResourceCatalogRecord[] {
    return this.dataService.listResourceCatalog(department);
  }

  getAvailability(department: string, type: string) {
    return {
      department,
      resourceType: type,
      availableCount: this.dataService.countAvailableResourcesByDepartmentType(
        department,
        type,
      ),
    };
  }

  create(payload: CreateResourceDto, context: RequestContext): ResourceRecord {
    const user = this.dataService.getActingUser(context);
    const department = payload.department || user?.department || 'Unassigned';
    this.dataService.ensureValidDepartmentResourceType(department, payload.type);
    return this.dataService.addResource({
      ...payload,
      department,
      status: payload.status || 'Available',
      assignedTo: payload.assignedTo || 'None',
    });
  }

  update(id: string, payload: UpdateResourceDto): ResourceRecord {
    return this.dataService.updateResource(id, payload);
  }

  requestMaintenance(id: string, context: RequestContext) {
    return this.dataService.requestMaintenance(id, context);
  }

  initiateReturn(id: string, context: RequestContext) {
    return this.dataService.initiateReturn(id, context);
  }

  confirmRepaired(id: string, context: RequestContext) {
    return this.dataService.confirmRepairedAllocation(id, context);
  }

  scrap(id: string) {
    return this.dataService.updateResource(id, { status: 'Scrapped' });
  }
}
