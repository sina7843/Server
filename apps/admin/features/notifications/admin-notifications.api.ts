import { createAdminNotificationsClient } from '@dragon/sdk';
import type {
  AdminNotificationsListParams,
  NotificationLogDto,
  NotificationLogListResponseDto,
} from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';

export async function listNotificationLogs(
  client: ApiClient,
  params?: AdminNotificationsListParams,
): Promise<NotificationLogListResponseDto> {
  return createAdminNotificationsClient(client).listNotificationLogs(params);
}

export async function getNotificationLog(
  client: ApiClient,
  id: string,
): Promise<NotificationLogDto> {
  return createAdminNotificationsClient(client).getNotificationLog(id);
}
