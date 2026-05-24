import type { ApiClient } from './client';
import type { NotificationLogDto, NotificationLogListResponseDto } from '@dragon/types';
import type { AdminNotificationsClient, AdminNotificationsListParams } from './admin-notifications-types';

export function createAdminNotificationsClient(client: ApiClient): AdminNotificationsClient {
  return {
    listNotificationLogs(params?: AdminNotificationsListParams): Promise<NotificationLogListResponseDto> {
      const search = new URLSearchParams();
      if (params?.channel) search.set('channel', params.channel);
      if (params?.status) search.set('status', params.status);
      if (params?.provider) search.set('provider', params.provider);
      if (params?.templateKey) search.set('templateKey', params.templateKey);
      if (params?.purpose) search.set('purpose', params.purpose);
      if (params?.recipientHash) search.set('recipientHash', params.recipientHash);
      if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
      if (params?.dateTo) search.set('dateTo', params.dateTo);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<NotificationLogListResponseDto>({
        method: 'GET',
        path: `/admin/v1/system/notifications${qs ? `?${qs}` : ''}`,
      });
    },

    getNotificationLog(id: string): Promise<NotificationLogDto> {
      return client.request<NotificationLogDto>({
        method: 'GET',
        path: `/admin/v1/system/notifications/${encodeURIComponent(id)}`,
      });
    },
  };
}
