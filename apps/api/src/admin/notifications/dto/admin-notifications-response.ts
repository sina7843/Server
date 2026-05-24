import type {
  NotificationLogDto,
  NotificationLogListItemDto,
  NotificationLogListResponseDto,
} from '@dragon/types';
import type { NotificationLogDocument } from '../../../auth/notifications/notification-log.schema';

export function toNotificationLogListItemDto(
  doc: NotificationLogDocument,
): NotificationLogListItemDto {
  const item: NotificationLogListItemDto = {
    id: String(doc._id),
    channel: doc.channel,
    provider: doc.provider,
    recipientMasked: doc.recipientMasked,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
  if (doc.templateKey !== undefined) item.templateKey = doc.templateKey;
  if (doc.purpose !== undefined) item.purpose = doc.purpose;
  if (doc.errorCode !== undefined) item.errorCode = doc.errorCode;
  return item;
}

export function toNotificationLogDto(doc: NotificationLogDocument): NotificationLogDto {
  const dto: NotificationLogDto = {
    id: String(doc._id),
    channel: doc.channel,
    provider: doc.provider,
    recipientMasked: doc.recipientMasked,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
  if (doc.templateKey !== undefined) dto.templateKey = doc.templateKey;
  if (doc.purpose !== undefined) dto.purpose = doc.purpose;
  if (doc.providerMessageId !== undefined) dto.providerMessageId = doc.providerMessageId;
  if (doc.errorCode !== undefined) dto.errorCode = doc.errorCode;
  if (doc.errorMessage !== undefined) dto.errorMessage = doc.errorMessage;
  if (doc.requestId !== undefined) dto.requestId = doc.requestId;
  if (doc.correlationId !== undefined) dto.correlationId = doc.correlationId;
  return dto;
}

export function toNotificationLogListResponse(
  items: NotificationLogDocument[],
  page: number,
  limit: number,
  total: number,
): NotificationLogListResponseDto {
  return {
    items: items.map(toNotificationLogListItemDto),
    page,
    limit,
    total,
  };
}
