import { createAdminDashboardClient } from '@dragon/sdk';
import type { ApiClient, AdminDashboardSummaryResponse } from '@dragon/sdk';

export async function getDashboardSummary(
  client: ApiClient,
): Promise<AdminDashboardSummaryResponse> {
  return createAdminDashboardClient(client).getSummary();
}
