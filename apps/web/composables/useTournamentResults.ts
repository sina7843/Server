import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

export function useTournamentResults() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
