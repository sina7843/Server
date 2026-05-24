import type {
  AuditLogDetailDto,
  AuditLogListItemDto,
  AuditLogListResponseDto,
} from '@dragon/types';
import type { AuditLogDocument } from '../../../audit/audit-log.schema';

export function toAuditLogListItemDto(doc: AuditLogDocument): AuditLogListItemDto {
  return {
    id: String(doc._id),
    ...(doc.actorId !== undefined ? { actorId: String(doc.actorId) } : {}),
    actorType: doc.actorType,
    action: doc.action,
    resourceType: doc.resourceType,
    ...(doc.resourceId !== undefined ? { resourceId: doc.resourceId } : {}),
    severity: doc.severity,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toAuditLogDetailDto(doc: AuditLogDocument): AuditLogDetailDto {
  return {
    id: String(doc._id),
    ...(doc.actorId !== undefined ? { actorId: String(doc.actorId) } : {}),
    actorType: doc.actorType,
    action: doc.action,
    resourceType: doc.resourceType,
    ...(doc.resourceId !== undefined ? { resourceId: doc.resourceId } : {}),
    ...(doc.before !== undefined ? { before: doc.before as Record<string, unknown> } : {}),
    ...(doc.after !== undefined ? { after: doc.after as Record<string, unknown> } : {}),
    ...(doc.metadata !== undefined ? { metadata: doc.metadata as Record<string, unknown> } : {}),
    ...(doc.ip !== undefined ? { ip: doc.ip } : {}),
    ...(doc.userAgent !== undefined ? { userAgent: doc.userAgent } : {}),
    ...(doc.requestId !== undefined ? { requestId: doc.requestId } : {}),
    ...(doc.correlationId !== undefined ? { correlationId: doc.correlationId } : {}),
    severity: doc.severity,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toAuditLogListResponse(
  items: AuditLogDocument[],
  total: number,
  page: number,
  limit: number,
): AuditLogListResponseDto {
  return {
    items: items.map(toAuditLogListItemDto),
    page,
    limit,
    total,
  };
}
