import type { ApiClient } from './client';
import type {
  AdminTournamentParticipantsClient,
  AdminTournamentParticipantListParams,
  AdminTournamentParticipantListResponseDto,
  UpdateTournamentParticipantDto,
} from './admin-tournament-participants-types';
import type { TournamentParticipantDto } from '@dragon/types';

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

    update(
      tournamentId: string,
      participantId: string,
      input: UpdateTournamentParticipantDto,
    ): Promise<TournamentParticipantDto> {
      return client.request<TournamentParticipantDto>({
        method: 'PATCH',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    remove(tournamentId: string, participantId: string): Promise<void> {
      return client.request<void>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}/remove`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    disqualify(tournamentId: string, participantId: string): Promise<TournamentParticipantDto> {
      return client.request<TournamentParticipantDto>({
        method: 'POST',
        path: `/admin/v1/tournaments/${encodeURIComponent(tournamentId)}/participants/${encodeURIComponent(participantId)}/disqualify`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}
