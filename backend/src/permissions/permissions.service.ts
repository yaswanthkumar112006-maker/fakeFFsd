import { PermissionsMatrixRecord } from '../common/domain';
import { Injectable } from '@nestjs/common';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly dataService: DataService) {}

  getMatrix(context: RequestContext): PermissionsMatrixRecord {
    return this.dataService.getPermissionsMatrix();
  }

  updateMatrix(payload: PermissionsMatrixRecord): PermissionsMatrixRecord {
    return this.dataService.updatePermissions(payload);
  }

  resetMatrix(): PermissionsMatrixRecord {
    return this.dataService.resetPermissions();
  }
}
