import type { ApiClient } from './client';
import type { AdminTournamentStandingsClient } from './admin-tournament-standings-types';
import type { TournamentStandingsDto, RecalculateStandingsResultDto } from '@dragon/types';

export function createAdminTournamentStandingsClient(
  client: ApiClient,
): AdminTournamentStandingsClient {
  return {
    get(tournamentId: string): Promise<TournamentStandingsDto> {
      return client.request<TournamentStandingsDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/standings`,
      });
    },

    recalculate(tournamentId: string): Promise<RecalculateStandingsResultDto> {
      return client.request<RecalculateStandingsResultDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/standings/recalculate`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
