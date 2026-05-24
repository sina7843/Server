import type {
  AuditLogDetailDto,
  AuditLogListItemDto,
  AuditLogListResponseDto,
} from '@dragon/types';
import type { AuditActorType, AuditSeverity } from '@dragon/types';

export type { AuditLogDetailDto, AuditLogListItemDto, AuditLogListResponseDto };

export interface AdminAuditListParams {
  readonly actorId?: string;
  readonly actorType?: AuditActorType;
  readonly action?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly severity?: AuditSeverity;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminAuditClient {
  listAuditLogs(params?: AdminAuditListParams): Promise<AuditLogListResponseDto>;
  getAuditLog(id: string): Promise<AuditLogDetailDto>;
}
