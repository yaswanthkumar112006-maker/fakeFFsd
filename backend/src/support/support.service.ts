import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { SupportTicketRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { CreateTicketDto, ResolveTicketDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): SupportTicketRecord[] {
    const all = this.dataService.getSupportTickets();
    if (context.role === 'Employee') {
      // Employees see tickets for organizations they are assigned to
      const myOrgs = this.dataService.getOrganizations().filter(o => o.assignedEmployeeId === context.userId).map(o => o.id);
      return all.filter(t => myOrgs.includes(t.organizationId));
    }
    if (context.role === 'Owner') {
      return all;
    }
    // Normal users see only their org's tickets
    return all.filter(t => t.organizationId === context.organizationId);
  }

  create(context: RequestContext, payload: CreateTicketDto): SupportTicketRecord {
    const user = this.dataService.getUserById(context.userId || '');
    const ticket: SupportTicketRecord = {
      id: `TKT-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      title: payload.title,
      description: payload.description,
      status: 'Open',
      createdBy: user ? user.name : 'Unknown',
      createdById: context.userId || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    return this.dataService.insertSupportTicket(ticket);
  }

  resolve(id: string, payload: ResolveTicketDto): SupportTicketRecord {
    return this.dataService.updateSupportTicket(id, { 
      reply: payload.reply, 
      status: payload.status || 'Resolved' 
    });
  }
}
