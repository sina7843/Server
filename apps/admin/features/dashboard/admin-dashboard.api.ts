import { ApiClientError, createAdminDashboardClient, createApiClient } from '@dragon/sdk';
import type { AdminDashboardSummaryResponse } from '@dragon/sdk';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

function getClient() {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    throw new ApiClientError('Not authenticated.', 401);
  }

  return createAdminDashboardClient(
    createApiClient({
      baseUrl: '/',
      headers: { Authorization: `Bearer ${accessToken.value}` },
    }),
  );
}

export async function getDashboardSummary(): Promise<AdminDashboardSummaryResponse> {
  return getClient().getSummary();
}
