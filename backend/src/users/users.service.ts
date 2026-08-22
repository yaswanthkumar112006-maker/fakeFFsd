import { Injectable } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): UserRecord[] {
    const users = this.dataService.getUsers();
    if (context.role === 'System Admin' || context.role === 'Guest') {
      return users;
    }

    const actingUser = context.userId ? this.dataService.getUserById(context.userId) : undefined;
    if (!actingUser) {
      return [];
    }
    return [actingUser];
  }

  create(payload: CreateUserDto): UserRecord {
    const users = this.dataService.getUsers();
    const newId = `U${users.length + 1}_${Date.now()}`;
    const user: UserRecord = {
      id: newId,
      ...payload,
      status: payload.status || 'Active',
      preferences: { notifications: true }
    };
    return this.dataService.insertUser(user);
  }

  update(id: string, payload: UpdateUserDto): UserRecord {
    return this.dataService.updateUser(id, payload);
  }

  deactivate(id: string): UserRecord {
    return this.dataService.updateUser(id, { status: 'Inactive' });
  }
}
