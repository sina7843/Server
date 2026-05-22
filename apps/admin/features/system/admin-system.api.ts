import { createAdminSystemClient } from '@dragon/sdk';
import type { ApiClient, AdminSystemHealthResponse } from '@dragon/sdk';

export async function getSystemHealth(client: ApiClient): Promise<AdminSystemHealthResponse> {
  return createAdminSystemClient(client).getHealth();
}
