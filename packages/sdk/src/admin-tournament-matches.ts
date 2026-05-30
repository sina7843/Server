import type { ApiClient } from './client';
import type {
  AdminTournamentMatchesClient,
  AdminTournamentMatchListParams,
  AdminTournamentMatchListResponseDto,
} from './admin-tournament-matches-types';
import type {
  AdminTournamentMatchDto,
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
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

    create(
      tournamentId: string,
      input: CreateTournamentMatchDto,
    ): Promise<AdminTournamentMatchDto> {
      return client.request<AdminTournamentMatchDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    generate(tournamentId: string): Promise<AdminTournamentMatchListResponseDto> {
      return client.request<AdminTournamentMatchListResponseDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/generate`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    update(
      tournamentId: string,
      matchId: string,
      input: UpdateTournamentMatchDto,
    ): Promise<AdminTournamentMatchDto> {
      return client.request<AdminTournamentMatchDto>({
        method: 'PATCH',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    cancel(tournamentId: string, matchId: string): Promise<AdminTournamentMatchDto> {
      return client.request<AdminTournamentMatchDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/cancel`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
