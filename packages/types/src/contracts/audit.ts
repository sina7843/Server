import type { AuditActorType, AuditSeverity } from '../constants/audit';

export interface AuditLogDto {
  readonly id: string;
  readonly actorId?: string;
  readonly actorType: AuditActorType;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly severity: AuditSeverity;
  readonly createdAt: string;
}

export interface AuditLogListItemDto {
  readonly id: string;
  readonly actorId?: string;
  readonly actorType: AuditActorType;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly severity: AuditSeverity;
  readonly createdAt: string;
}
