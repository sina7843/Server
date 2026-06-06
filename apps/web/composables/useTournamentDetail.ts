import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: tournament.viewed is fired server-side from PublicTournamentsController.getBySlug()
// on each successful GET /api/v1/tournaments/:slug response (Slice 11).

export function useTournamentDetail() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
