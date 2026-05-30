import type { ApiClient } from './client';
import type { TournamentsClient, TournamentListParams } from './tournament-types';
import type {
  PublicTournamentDto,
  TournamentListResponseDto,
  TournamentRegistrationInputDto,
  UpdateTournamentRegistrationDto,
  MyTournamentRegistrationDto,
  TournamentStandingsDto,
  BracketProjectionDto,
  TournamentMatchResultDto,
} from '@dragon/types';
import type { AdminTournamentParticipantListResponseDto } from './admin-tournament-participants-types';
import type { AdminTournamentMatchListResponseDto } from './admin-tournament-matches-types';

export function createTournamentsClient(client: ApiClient): TournamentsClient {
  return {
    list(params?: TournamentListParams): Promise<TournamentListResponseDto> {
      const search = new URLSearchParams();
      if (params?.q) search.set('q', params.q);
      if (params?.gameId) search.set('gameId', params.gameId);
      if (params?.status) search.set('status', params.status);
      if (params?.format) search.set('format', params.format);
      if (params?.registrationOpen !== undefined)
        search.set('registrationOpen', String(params.registrationOpen));
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<TournamentListResponseDto>({
        method: 'GET',
        path: `/api/v1/tournaments${qs ? `?${qs}` : ''}`,
      });
    },

    getBySlug(slug: string): Promise<PublicTournamentDto> {
      return client.request<PublicTournamentDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}`,
      });
    },

    register(
      slug: string,
      input: TournamentRegistrationInputDto,
    ): Promise<MyTournamentRegistrationDto> {
      return client.request<MyTournamentRegistrationDto>({
        method: 'POST',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/register`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    getMyRegistration(slug: string): Promise<MyTournamentRegistrationDto> {
      return client.request<MyTournamentRegistrationDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/my-registration`,
      });
    },

    updateMyRegistration(
      slug: string,
      input: UpdateTournamentRegistrationDto,
    ): Promise<MyTournamentRegistrationDto> {
      return client.request<MyTournamentRegistrationDto>({
        method: 'PATCH',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/my-registration`,
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    withdrawMyRegistration(slug: string): Promise<void> {
      return client.request<void>({
        method: 'POST',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/my-registration/withdraw`,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    getParticipants(slug: string): Promise<AdminTournamentParticipantListResponseDto> {
      return client.request<AdminTournamentParticipantListResponseDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/participants`,
      });
    },

    getMatches(slug: string): Promise<AdminTournamentMatchListResponseDto> {
      return client.request<AdminTournamentMatchListResponseDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/matches`,
      });
    },

    getResults(slug: string): Promise<readonly TournamentMatchResultDto[]> {
      return client.request<readonly TournamentMatchResultDto[]>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/results`,
      });
    },

    getStandings(slug: string): Promise<TournamentStandingsDto> {
      return client.request<TournamentStandingsDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/standings`,
      });
    },

    getBracket(slug: string): Promise<BracketProjectionDto> {
      return client.request<BracketProjectionDto>({
        method: 'GET',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/bracket`,
      });
    },
  };
}
