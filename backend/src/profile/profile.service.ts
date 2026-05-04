import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly dataService: DataService) {}

  getMe(context: RequestContext) {
    return this.dataService.getActingUser(context);
  }

  updateProfile(context: RequestContext, payload: UpdateProfileDto): UserRecord {
    const user = this.dataService.getActingUser(context);
    if (!user) {
      throw new BadRequestException('Active demo user not found.');
    }
    return this.dataService.updateUser(user.id, {
      name: payload.name ?? user.name,
      preferences: {
        notifications:
          typeof payload.notifications === 'boolean'
            ? payload.notifications
            : user.preferences?.notifications ?? true,
      },
    });
  }

  updatePassword(context: RequestContext, payload: UpdatePasswordDto): UserRecord {
    const user = this.dataService.getActingUser(context);
    if (!user) {
      throw new BadRequestException('Active demo user not found.');
    }
    if ((user.password || '') !== payload.currentPassword) {
      throw new BadRequestException('Current password is incorrect.');
    }
    return this.dataService.updateUser(user.id, { password: payload.newPassword });
  }
}
