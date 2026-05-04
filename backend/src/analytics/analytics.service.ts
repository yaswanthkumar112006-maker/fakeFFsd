import { Injectable } from '@nestjs/common';
import { ProcurementRecord, RequestRecord, ResourceRecord, StockThresholdRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataService: DataService) {}

  getRequestorSummary(context: RequestContext) {
    const requests = this.dataService.getCollection('requests', context) as RequestRecord[];
    const resources = this.dataService.getCollection('resources', context) as ResourceRecord[];
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      approvedRequests: requests.filter((item) => item.status === 'Approved').length,
      allocatedRequests: requests.filter((item) => item.status === 'Allocated').length,
      resources: resources.length,
      maintenance: resources.filter((item) => ['Maintenance Requested', 'Maintenance'].includes(item.status)).length,
    };
  }

  getDepartmentSummary(context: RequestContext) {
    const resources = this.dataService.getCollection('resources', context) as ResourceRecord[];
    const requests = this.dataService.getCollection('requests', context) as RequestRecord[];
    const procurements = this.dataService.getCollection('procurements', context) as ProcurementRecord[];
    return {
      totalResources: resources.length,
      available: resources.filter((item) => item.status === 'Available').length,
      allocated: resources.filter((item) => item.status === 'Allocated').length,
      maintenance: resources.filter((item) => ['Maintenance Requested', 'Maintenance'].includes(item.status)).length,
      scrap: resources.filter((item) => item.status === 'Scrapped').length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      procurements,
    };
  }

  getRegistrarSummary(context: RequestContext) {
    const resources = this.dataService.getCollection('resources', context) as ResourceRecord[];
    const requests = this.dataService.getCollection('requests', context) as RequestRecord[];
    const procurements = this.dataService.getCollection('procurements', context) as ProcurementRecord[];
    return {
      totalAssets: resources.length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      pendingProcurements: procurements.filter((item) => item.status === 'Pending').length,
      approvedToday:
        requests.filter((item) => item.status === 'Approved').length +
        procurements.filter((item) => item.status === 'Approved').length,
    };
  }

  getStock(context: RequestContext) {
    const thresholds = this.dataService.getCollection('stockThresholds', context) as StockThresholdRecord[];
    const resources = this.dataService.getCollection('resources', context) as ResourceRecord[];
    return thresholds.map((threshold) => {
      const currentQuantity = resources.filter(
        (resource) =>
          resource.department === threshold.department &&
          resource.status === 'Available' &&
          (resource.type === threshold.resourceType || resource.name === threshold.resourceType),
      ).length;
      const status =
        currentQuantity >= threshold.thresholdLevel
          ? 'Safe'
          : currentQuantity >= threshold.thresholdLevel * 0.7
            ? 'Near Threshold'
            : 'Low Stock';
      return { ...threshold, currentQuantity, status };
    });
  }

  updateStockThreshold(id: string, level: number, context: RequestContext) {
    return this.dataService.updateStockThreshold(id, level, context);
  }
}
