import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

export function useTournamentParticipants() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
