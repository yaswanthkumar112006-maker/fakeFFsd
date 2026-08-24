import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { RegisterOrgDto } from './dto/organization.dto';
import { OrganizationRecord, OrganizationStatus } from '../common/domain';
import { randomBytes } from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly dataService: DataService) {}

  getAll(): OrganizationRecord[] {
    return this.dataService.getOrganizations();
  }

  getPublicOrganizations(): Partial<OrganizationRecord>[] {
    return this.dataService.getOrganizations()
      .filter(org => org.status === 'Active')
      .map(org => ({ id: org.id, name: org.name }));
  }

  register(payload: RegisterOrgDto): OrganizationRecord {
    // Basic validations
    if (!payload.name || !payload.adminEmail || !payload.subscriptionPlanId) {
      throw new BadRequestException('Missing required fields for organization registration.');
    }

    // Verify subscription plan exists
    const plans = this.dataService.getSubscriptionPlans();
    if (!plans.some(p => p.id === payload.subscriptionPlanId)) {
      throw new BadRequestException('Invalid subscription plan ID.');
    }

    const orgId = `ORG-${Date.now()}`;
    const newOrg: OrganizationRecord = {
      id: orgId,
      name: payload.name,
      adminEmail: payload.adminEmail,
      subscriptionPlanId: payload.subscriptionPlanId,
      status: 'Pending',
      revenueGenerated: 0
    };

    return this.dataService.insertOrganization(newOrg);
  }

  updateStatus(id: string, status: OrganizationStatus, employeeId?: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    const updates: Partial<OrganizationRecord> = { status };
    if (employeeId) {
      updates.assignedEmployeeId = employeeId;
    }

    return this.dataService.updateOrganization(id, updates);
  }

  getMyOrganization(orgId: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found.`);
    }
    return org;
  }

  updateSubscription(orgId: string, planId: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found.`);
    }
    const plans = this.dataService.getSubscriptionPlans();
    if (!plans.some(p => p.id === planId)) {
      throw new BadRequestException('Invalid subscription plan ID.');
    }
    return this.dataService.updateOrganization(orgId, { subscriptionPlanId: planId });
  }
}
