import { createContentApi } from '../features/content/content-api';

export function usePublicContent() {
  const runtimeConfig = useRuntimeConfig();
  return createContentApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
