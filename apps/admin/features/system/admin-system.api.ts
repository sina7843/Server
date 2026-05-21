import { ApiClientError, createAdminSystemClient, createApiClient } from '@dragon/sdk';
import type { AdminSystemHealthResponse } from '@dragon/sdk';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

function getClient() {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    throw new ApiClientError('Not authenticated.', 401);
  }

  return createAdminSystemClient(
    createApiClient({
      baseUrl: '/',
      headers: { Authorization: `Bearer ${accessToken.value}` },
    }),
  );
}

export async function getSystemHealth(): Promise<AdminSystemHealthResponse> {
  return getClient().getHealth();
}
