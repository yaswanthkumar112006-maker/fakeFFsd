import { Injectable } from '@nestjs/common';
import { DepartmentRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): DepartmentRecord[] {
    const all = this.dataService.getDepartments();
    // Organization isolation — only return departments belonging to the user's org
    if (context.organizationId) {
      return all.filter((d) => d.organizationId === context.organizationId);
    }
    return all;
  }

  create(context: RequestContext, payload: CreateDepartmentDto): DepartmentRecord {
    const dept: DepartmentRecord = {
      id: `D${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      ...payload,
      memberCount: payload.memberCount || 0
    };
    return this.dataService.insertDepartment(dept);
  }

  update(id: string, payload: UpdateDepartmentDto): DepartmentRecord {
    return this.dataService.updateDepartment(id, payload);
  }

  remove(id: string): DepartmentRecord {
    return this.dataService.deleteDepartment(id);
  }
}
