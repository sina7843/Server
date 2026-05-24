import type { ApiClient } from './client';
import type { AuditLogDetailDto, AuditLogListResponseDto } from '@dragon/types';
import type { AdminAuditClient, AdminAuditListParams } from './admin-audit-types';

export function createAdminAuditClient(client: ApiClient): AdminAuditClient {
  return {
    listAuditLogs(params?: AdminAuditListParams): Promise<AuditLogListResponseDto> {
      const search = new URLSearchParams();
      if (params?.actorId) search.set('actorId', params.actorId);
      if (params?.actorType) search.set('actorType', params.actorType);
      if (params?.action) search.set('action', params.action);
      if (params?.resourceType) search.set('resourceType', params.resourceType);
      if (params?.resourceId) search.set('resourceId', params.resourceId);
      if (params?.severity) search.set('severity', params.severity);
      if (params?.requestId) search.set('requestId', params.requestId);
      if (params?.correlationId) search.set('correlationId', params.correlationId);
      if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
      if (params?.dateTo) search.set('dateTo', params.dateTo);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<AuditLogListResponseDto>({
        method: 'GET',
        path: `/admin/v1/audit-logs${qs ? `?${qs}` : ''}`,
      });
    },

    getAuditLog(id: string): Promise<AuditLogDetailDto> {
      return client.request<AuditLogDetailDto>({
        method: 'GET',
        path: `/admin/v1/audit-logs/${encodeURIComponent(id)}`,
      });
    },
  };
}
