import type {
  NotificationChannel,
  NotificationStatus,
  NotificationLogDto,
  NotificationLogListItemDto,
  NotificationLogListResponseDto,
} from '@dragon/types';

export type {
  NotificationChannel,
  NotificationStatus,
  NotificationLogDto,
  NotificationLogListItemDto,
  NotificationLogListResponseDto,
};

export interface AdminNotificationsListParams {
  readonly channel?: NotificationChannel;
  readonly status?: NotificationStatus;
  readonly provider?: string;
  readonly templateKey?: string;
  readonly purpose?: string;
  readonly recipientHash?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminNotificationsClient {
  listNotificationLogs(
    params?: AdminNotificationsListParams,
  ): Promise<NotificationLogListResponseDto>;
  getNotificationLog(id: string): Promise<NotificationLogDto>;
}
