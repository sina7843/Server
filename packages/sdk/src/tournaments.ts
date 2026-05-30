import type { ApiClient } from './client';
import type { TournamentsClient, TournamentListParams } from './tournament-types';
import type {
  PublicTournamentDto,
  TournamentListResponseDto,
  TournamentRegistrationInputDto,
  MyTournamentRegistrationDto,
  TournamentStandingsDto,
  BracketProjectionDto,
} from '@dragon/types';

export function createTournamentsClient(client: ApiClient): TournamentsClient {
  return {
    list(params?: TournamentListParams): Promise<TournamentListResponseDto> {
      const search = new URLSearchParams();
      if (params?.gameId) search.set('gameId', params.gameId);
      if (params?.status) search.set('status', params.status);
      if (params?.format) search.set('format', params.format);
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

    withdrawRegistration(slug: string): Promise<void> {
      return client.request<void>({
        method: 'DELETE',
        path: `/api/v1/tournaments/${encodeURIComponent(slug)}/my-registration`,
      });
    },
  };
}
