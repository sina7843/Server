import { createApiClient } from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';

export function useAdminApiClient(): ApiClient {
  const { public: { apiBaseUrl } } = useRuntimeConfig();
  const { accessToken } = useAdminAuthState();

  return createApiClient({
    baseUrl: String(apiBaseUrl),
    ...(accessToken.value ? { headers: { Authorization: `Bearer ${accessToken.value}` } } : {}),
  });
}
