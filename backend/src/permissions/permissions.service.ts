import { PermissionsMatrixRecord } from '../common/domain';
import { Injectable } from '@nestjs/common';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly dataService: DataService) {}

  getMatrix(context: RequestContext) {
    return this.dataService.getCollection('permissionsMatrix', context);
  }

  updateMatrix(payload: PermissionsMatrixRecord) {
    return this.dataService.updatePermissions(payload);
  }

  resetMatrix() {
    return this.dataService.resetPermissions();
  }
}
