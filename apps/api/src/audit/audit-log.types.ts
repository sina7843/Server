import type { Types } from 'mongoose';
import type { AuditActorType, AuditSeverity } from '@dragon/types';

export type AuditLogId = Types.ObjectId | string;

export interface WriteAuditLogInput {
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
  readonly severity?: AuditSeverity;
}
