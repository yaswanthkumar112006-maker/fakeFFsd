import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';

@Injectable()
export class PlatformAnalyticsService {
  constructor(private readonly dataService: DataService) {}

  getAnalytics() {
    const orgs = this.dataService.getOrganizations();
    const users = this.dataService.getUsers();
    const plans = this.dataService.getSubscriptionPlans();

    const activeOrgList = orgs.filter(o => o.status === 'Active');
    const pendingOrgs = orgs.filter(o => o.status === 'Pending').length;

    // Annual recurring revenue: each active org's current plan price. Mirrors the
    // per-org math the Owner dashboard's "Revenue" tab already computes client-side
    // (frontend/js/pages/owner.js#renderRevenue) — the old approach of summing a
    // revenueGenerated field never worked, since nothing ever set that field to
    // anything but 0.
    const pricePerYearByPlanId = new Map(plans.map((plan) => [plan.id, plan.pricePerYear]));
    const totalRevenue = activeOrgList.reduce(
      (sum, org) => sum + (pricePerYearByPlanId.get(org.subscriptionPlanId) || 0),
      0,
    );

    const totalUsers = users.length;

    return {
      activeOrgs: activeOrgList.length,
      pendingOrgs,
      totalRevenue,
      totalUsers,
    };
  }
}
