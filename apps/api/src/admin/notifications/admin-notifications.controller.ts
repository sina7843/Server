import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { NotificationLogDto, NotificationLogListResponseDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { AdminNotificationsService } from './admin-notifications.service';

@Controller('admin/v1/system/notifications')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Get()
  @RequirePermission(Permissions.NOTIFICATION_LOG_READ)
  async listNotificationLogs(@Query() query: unknown): Promise<NotificationLogListResponseDto> {
    try {
      return await this.service.listNotificationLogs(query);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid query parameters');
    }
  }

  @Get(':id')
  @RequirePermission(Permissions.NOTIFICATION_LOG_READ)
  getNotificationLog(@Param('id') id: string): Promise<NotificationLogDto> {
    return this.service.getNotificationLog(id);
  }
}
