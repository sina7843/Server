import type { ApiClient } from './client';
import type {
  AdminTournamentParticipantsClient,
  AdminTournamentParticipantListParams,
  AdminTournamentParticipantListResponseDto,
} from './admin-tournament-participants-types';

export function createAdminTournamentParticipantsClient(
  client: ApiClient,
): AdminTournamentParticipantsClient {
  return {
    list(
      tournamentId: string,
      params?: AdminTournamentParticipantListParams,
    ): Promise<AdminTournamentParticipantListResponseDto> {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<AdminTournamentParticipantListResponseDto>({
        method: 'GET',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/participants${qs ? `?${qs}` : ''}`,
      });
    },
  };
}
