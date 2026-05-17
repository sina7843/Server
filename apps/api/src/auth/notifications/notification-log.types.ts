export const NOTIFICATION_CHANNELS = ['sms', 'email'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ['queued', 'sent', 'failed', 'skipped'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface CreateNotificationLogInput {
  channel: NotificationChannel;
  provider: string;
  recipientMasked: string;
  recipientHash: string;
  status: NotificationStatus;
  templateKey?: string;
  purpose?: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  correlationId?: string;
}

export interface CreateSmsNotificationLogInput {
  provider: string;
  recipientPhoneNormalized: string;
  status: NotificationStatus;
  templateKey?: string;
  purpose?: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  requestId?: string;
  correlationId?: string;
}
