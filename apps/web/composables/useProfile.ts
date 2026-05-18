import { createApiClient, createProfilesClient } from '@dragon/sdk';

export function useProfile() {
  const runtimeConfig = useRuntimeConfig();
  const { token } = useAuthToken();

  return computed(() => {
    const apiClient = createApiClient({
      baseUrl: (runtimeConfig.public?.apiBaseUrl as string | undefined) ?? '/',
      headers: token.value
        ? {
            authorization: `Bearer ${token.value}`,
          }
        : undefined,
    });

    return createProfilesClient(apiClient);
  });
}
