import type { ApiClient } from './client';
import type {
  AdminTournamentMatchesClient,
  AdminTournamentMatchListParams,
  AdminTournamentMatchListResponseDto,
} from './admin-tournament-matches-types';
import type {
  AdminTournamentMatchDto,
  TournamentResultDto,
  UpdateTournamentResultDto,
} from '@dragon/types';

export function createAdminTournamentMatchesClient(
  client: ApiClient,
): AdminTournamentMatchesClient {
  return {
    list(
      tournamentId: string,
      params?: AdminTournamentMatchListParams,
    ): Promise<AdminTournamentMatchListResponseDto> {
      const search = new URLSearchParams();
      if (params?.round !== undefined) search.set('round', String(params.round));
      if (params?.status) search.set('status', params.status);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<AdminTournamentMatchListResponseDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches${qs ? `?${qs}` : ''}`,
      });
    },

    getById(tournamentId: string, matchId: string): Promise<AdminTournamentMatchDto> {
      return client.request<AdminTournamentMatchDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}`,
      });
    },

    updateResult(
      tournamentId: string,
      matchId: string,
      input: UpdateTournamentResultDto,
    ): Promise<TournamentResultDto> {
      return client.request<TournamentResultDto>({
        method: 'PUT',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/result`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
