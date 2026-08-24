import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';

@Injectable()
export class PlatformAnalyticsService {
  constructor(private readonly dataService: DataService) {}

  getAnalytics() {
    const orgs = this.dataService.getOrganizations();
    const users = this.dataService.getUsers();
    
    const activeOrgs = orgs.filter(o => o.status === 'Active').length;
    const pendingOrgs = orgs.filter(o => o.status === 'Pending').length;
    const totalRevenue = orgs.reduce((sum, o) => sum + (o.revenueGenerated || 0), 0);
    const totalUsers = users.length;
    
    return {
      activeOrgs,
      pendingOrgs,
      totalRevenue,
      totalUsers,
    };
  }
}
