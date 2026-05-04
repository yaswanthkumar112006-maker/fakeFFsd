import { Injectable } from '@nestjs/common';
import { ProcurementRecord, ProcurementRegistrationResourceInput } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import {
  CreateProcurementDto,
  ProcurementRegistrationResourceDto,
  UpdateProcurementDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext, filters?: { status?: string; department?: string }) {
    let items = this.dataService.getCollection('procurements', context) as ProcurementRecord[];
    if (filters?.status && filters.status !== 'All') {
      const statuses = filters.status.split(',').map((value) => value.trim());
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters?.department && filters.department !== 'All') {
      items = items.filter((item) => item.department === filters.department);
    }
    return items;
  }

  create(payload: CreateProcurementDto, context: RequestContext): ProcurementRecord {
    const user = this.dataService.getActingUser(context);
    const department = payload.department || user?.department || 'Unassigned';
    const resourceType = payload.resourceType || payload.item;
    this.dataService.ensureValidDepartmentResourceType(department, resourceType);
    return this.dataService.addProcurement({
      ...payload,
      id: payload.id || `PROC-${Date.now()}`,
      resourceType,
      item: payload.item || payload.resourceType,
      department,
      requestedBy: payload.requestedBy || payload.requester || user?.name || 'Unknown User',
      requester: payload.requester || payload.requestedBy || user?.name || 'Unknown User',
      requestedById: payload.requestedById || user?.id,
      status:
        context.role === 'Requestor'
          ? 'Pending Approval'
          : context.role === 'Dept Head'
            ? 'Pending'
            : payload.status || 'Pending',
      date: payload.date || new Date().toLocaleDateString('en-US'),
    });
  }

  update(id: string, payload: UpdateProcurementDto): ProcurementRecord {
    return this.dataService.updateProcurement(id, payload);
  }

  departmentApprove(id: string, context: RequestContext) {
    return this.dataService.approveDeptProcurement(id, context);
  }

  departmentReject(id: string, context: RequestContext) {
    return this.dataService.rejectDeptProcurement(id, context);
  }

  registrarApprove(id: string) {
    return this.dataService.approveRegistrarProcurement(id);
  }

  registrarReject(id: string) {
    return this.dataService.rejectRegistrarProcurement(id);
  }

  logPurchase(id: string, vendor: string, invoice: string, context: RequestContext) {
    return this.dataService.logPurchase(id, vendor, invoice, context);
  }

  register(id: string, resources: ProcurementRegistrationResourceDto[], context: RequestContext): ProcurementRecord {
    return this.dataService.registerProcurement(
      id,
      resources as ProcurementRegistrationResourceInput[],
      context,
    );
  }
}
