import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationLogDto, NotificationLogListResponseDto } from '@dragon/types';
import { NotificationService } from '../../notifications/notification.service';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { parseAdminNotificationQuery } from './dto/admin-notifications-query';
import {
  toNotificationLogDto,
  toNotificationLogListResponse,
} from './dto/admin-notifications-response';

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly notificationService: NotificationService) {}

  async listNotificationLogs(rawQuery: unknown): Promise<NotificationLogListResponseDto> {
    const { filters, page, limit } = parseAdminNotificationQuery(rawQuery);
    const { items, total } = await this.notificationService.listLogs(filters, page, limit);
    return toNotificationLogListResponse(items, page, limit, total);
  }

  async getNotificationLog(rawId: string): Promise<NotificationLogDto> {
    const id = validateObjectId(rawId, 'id');
    const log = await this.notificationService.getLog(id);
    if (!log) {
      throw new NotFoundException('Notification log not found.');
    }
    return toNotificationLogDto(log);
  }
}
