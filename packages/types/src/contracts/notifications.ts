export const NOTIFICATION_CHANNELS = ['sms', 'email'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ['queued', 'sent', 'failed', 'skipped'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationTemplateDto {
  id: string;
  key: string;
  channel: NotificationChannel;
  locale: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogDto {
  id: string;
  channel: NotificationChannel;
  provider: string;
  recipientMasked: string;
  templateKey?: string;
  purpose?: string;
  status: NotificationStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogListItemDto {
  id: string;
  channel: NotificationChannel;
  provider: string;
  recipientMasked: string;
  templateKey?: string;
  purpose?: string;
  status: NotificationStatus;
  errorCode?: string;
  createdAt: string;
}

export interface NotificationLogListQueryDto {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  provider?: string;
  templateKey?: string;
  purpose?: string;
  recipientHash?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface NotificationLogListResponseDto {
  items: NotificationLogListItemDto[];
  page: number;
  limit: number;
  total: number;
}
