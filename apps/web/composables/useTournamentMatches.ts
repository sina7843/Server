import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: tournament.match_viewed is fired server-side from PublicTournamentMatchesController.listMatches()
// on each successful GET /api/v1/tournaments/:slug/matches response (Slice 11).

export function useTournamentMatches() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
