import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: tournament.bracket_viewed is fired server-side from PublicTournamentBracketController.getBracket()
// on each successful GET /api/v1/tournaments/:slug/bracket response (Slice 11).

export function useTournamentBracket() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
