import { Injectable } from '@nestjs/common';
import { DepartmentRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext) {
    return this.dataService.getCollection('departments', context);
  }

  create(payload: CreateDepartmentDto): DepartmentRecord {
    return this.dataService.addDepartment(payload);
  }

  update(id: string, payload: UpdateDepartmentDto): DepartmentRecord {
    return this.dataService.updateDepartment(id, payload);
  }

  remove(id: string) {
    return this.dataService.deleteDepartment(id);
  }
}
