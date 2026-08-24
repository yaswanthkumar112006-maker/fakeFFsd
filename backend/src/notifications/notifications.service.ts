import { Injectable } from '@nestjs/common';
import { NotificationRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { UpdateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): NotificationRecord[] {
    let notifications = this.dataService.getNotifications();
    // Organization isolation — scope to user's org (allow 'PLATFORM' broadcast notifications)
    if (context.organizationId) {
      notifications = notifications.filter(
        (n) => !n.organizationId || n.organizationId === context.organizationId || n.organizationId === 'PLATFORM'
      );
    }
    return notifications.filter(
      (notification) =>
        notification.recipientRole === 'All' ||
        notification.recipientRole === context.role
    );
  }

  update(id: string, payload: UpdateNotificationDto): NotificationRecord {
    return this.dataService.updateNotification(id, payload);
  }
}
