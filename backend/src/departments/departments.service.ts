import { Injectable } from '@nestjs/common';
import { DepartmentRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): DepartmentRecord[] {
    return this.dataService.getDepartments();
  }

  create(payload: CreateDepartmentDto): DepartmentRecord {
    const depts = this.dataService.getDepartments();
    const newId = `D${depts.length + 1}_${Date.now()}`;
    const dept: DepartmentRecord = {
      id: newId,
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
