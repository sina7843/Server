import type { ApiClient } from './client';
import type { AdminTournamentResultsClient } from './admin-tournament-results-types';
import type {
  TournamentMatchResultDto,
  CreateMatchResultDto,
  UpdateMatchResultDto,
} from '@dragon/types';

export function createAdminTournamentResultsClient(
  client: ApiClient,
): AdminTournamentResultsClient {
  return {
    record(
      tournamentId: string,
      matchId: string,
      input: CreateMatchResultDto,
    ): Promise<TournamentMatchResultDto> {
      return client.request<TournamentMatchResultDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/result`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    update(
      tournamentId: string,
      matchId: string,
      input: UpdateMatchResultDto,
    ): Promise<TournamentMatchResultDto> {
      return client.request<TournamentMatchResultDto>({
        method: 'PATCH',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/result`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    void(tournamentId: string, matchId: string): Promise<void> {
      return client.request<void>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/result/void`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
