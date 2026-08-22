import { Injectable } from '@nestjs/common';
import { NotificationRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { UpdateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): NotificationRecord[] {
    const notifications = this.dataService.getNotifications();
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
