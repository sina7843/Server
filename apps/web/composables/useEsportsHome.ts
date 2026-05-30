import { createEsportsApi } from '../features/esports/esports-api';

export function useEsportsHome() {
  const runtimeConfig = useRuntimeConfig();
  const esports = createEsportsApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
  return useAsyncData('esports-home', () => esports.getHome());
}
