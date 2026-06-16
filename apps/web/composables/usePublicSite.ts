import { createApiClient, createSiteClient } from '@dragon/sdk';

export function usePublicSite() {
  const runtimeConfig = useRuntimeConfig();
  return createSiteClient(
    createApiClient({ baseUrl: (runtimeConfig.public?.apiBaseUrl as string | undefined) ?? '/' }),
  );
}
