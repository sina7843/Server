import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: fire 'tournament.bracket_viewed' when the public bracket page is viewed.
// Exact event name: 'tournament.bracket_viewed' (from ANALYTICS_EVENT_TYPES in @dragon/types).
// Full integration deferred — analytics composable not yet implemented client-side.
// Do NOT use: bracket_viewed, tournament_bracket_viewed, tournament.bracketViewed.

export function useTournamentBracket() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
