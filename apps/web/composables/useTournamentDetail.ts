import { createTournamentsDiscoveryApi } from '~/features/tournaments/tournaments-api';

// Analytics: fire 'tournament.viewed' when a public-safe detail page is viewed.
// Exact event name: 'tournament.viewed' (from ANALYTICS_EVENT_TYPES in @dragon/types).
// Full integration deferred — analytics composable not yet implemented client-side.
// Do NOT use: tournament_viewed, tournament.detail_viewed, tournament_view.

export function useTournamentDetail() {
  const runtimeConfig = useRuntimeConfig();
  return createTournamentsDiscoveryApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });
}
