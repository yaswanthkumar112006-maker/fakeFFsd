import { Injectable } from '@nestjs/common';
import { ResourceCondition, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';

@Injectable()
export class ReturnsService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext) {
    return this.dataService.getCollection('returnHistory', context);
  }

  process(resourceId: string, condition: ResourceCondition, context: RequestContext): ResourceRecord {
    return this.dataService.processReturn(resourceId, condition, context);
  }
}
