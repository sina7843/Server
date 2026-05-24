import { createAdminAuditClient } from '@dragon/sdk';
import type { AdminAuditListParams, AuditLogDetailDto, AuditLogListResponseDto } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';

export async function listAuditLogs(
  client: ApiClient,
  params?: AdminAuditListParams,
): Promise<AuditLogListResponseDto> {
  return createAdminAuditClient(client).listAuditLogs(params);
}

export async function getAuditLog(client: ApiClient, id: string): Promise<AuditLogDetailDto> {
  return createAdminAuditClient(client).getAuditLog(id);
}
