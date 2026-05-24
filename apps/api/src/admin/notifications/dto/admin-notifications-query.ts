import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from '@dragon/types';
import type { NotificationLogListFilters } from '../../../notifications/notification.service';

export interface AdminNotificationLogQuery {
  channel?: string;
  status?: string;
  provider?: string;
  templateKey?: string;
  purpose?: string;
  recipientHash?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}

export function parseAdminNotificationQuery(raw: unknown): {
  filters: NotificationLogListFilters;
  page: number;
  limit: number;
} {
  const q = (raw ?? {}) as Record<string, unknown>;

  const channel = typeof q.channel === 'string' ? q.channel.trim() : undefined;
  if (channel !== undefined && !NOTIFICATION_CHANNELS.includes(channel as never)) {
    throw new Error(`Invalid channel: ${channel}`);
  }

  const status = typeof q.status === 'string' ? q.status.trim() : undefined;
  if (status !== undefined && !NOTIFICATION_STATUSES.includes(status as never)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const provider = typeof q.provider === 'string' ? q.provider.trim() || undefined : undefined;
  const templateKey =
    typeof q.templateKey === 'string' ? q.templateKey.trim() || undefined : undefined;
  const purpose = typeof q.purpose === 'string' ? q.purpose.trim() || undefined : undefined;
  const recipientHash =
    typeof q.recipientHash === 'string' ? q.recipientHash.trim() || undefined : undefined;

  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (typeof q.dateFrom === 'string' && q.dateFrom.trim()) {
    const d = new Date(q.dateFrom);
    if (isNaN(d.getTime())) throw new Error('Invalid dateFrom');
    dateFrom = d;
  }

  if (typeof q.dateTo === 'string' && q.dateTo.trim()) {
    const d = new Date(q.dateTo);
    if (isNaN(d.getTime())) throw new Error('Invalid dateTo');
    dateTo = d;
  }

  if (dateFrom !== undefined && dateTo !== undefined && dateFrom > dateTo) {
    throw new Error('dateFrom must not be after dateTo');
  }

  const rawPage = typeof q.page === 'string' ? parseInt(q.page, 10) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const rawLimit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : 20;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

  return {
    filters: {
      ...(channel !== undefined ? { channel: channel as never } : {}),
      ...(status !== undefined ? { status: status as never } : {}),
      ...(provider !== undefined ? { provider } : {}),
      ...(templateKey !== undefined ? { templateKey } : {}),
      ...(purpose !== undefined ? { purpose } : {}),
      ...(recipientHash !== undefined ? { recipientHash } : {}),
      ...(dateFrom !== undefined ? { dateFrom } : {}),
      ...(dateTo !== undefined ? { dateTo } : {}),
    },
    page,
    limit,
  };
}
