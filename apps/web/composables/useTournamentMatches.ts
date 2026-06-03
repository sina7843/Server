import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: fire 'tournament.match_viewed' when the public matches list page is viewed.
// Exact event name: 'tournament.match_viewed' (from ANALYTICS_EVENT_TYPES in @dragon/types).
// Full integration deferred — analytics composable not yet implemented client-side.
// Do NOT use: match_viewed, tournament_match_viewed, tournament.matches_viewed, tournament.matchListViewed.

export function useTournamentMatches() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
