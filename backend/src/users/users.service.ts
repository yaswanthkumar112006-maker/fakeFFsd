import { Injectable } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext) {
    return this.dataService.getCollection('users', context);
  }

  create(payload: CreateUserDto): UserRecord {
    return this.dataService.addUser({ ...payload, preferences: { notifications: true } });
  }

  update(id: string, payload: UpdateUserDto): UserRecord {
    return this.dataService.updateUser(id, payload);
  }

  deactivate(id: string) {
    return this.dataService.updateUser(id, { status: 'Inactive' });
  }
}
