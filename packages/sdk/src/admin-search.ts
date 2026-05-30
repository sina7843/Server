import type { ApiClient } from './client';
import type {
  AdminSearchClient,
  AdminSearchParams,
  AdminTournamentSearchParams,
} from './admin-search-types';
import type {
  AdminReindexRequestDto,
  AdminReindexResponseDto,
  SearchResultResponseDto,
  TournamentListResponseDto,
} from '@dragon/types';

function buildSearchQs(params?: AdminSearchParams): string {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.page !== undefined) search.set('page', String(params.page));
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  return search.toString();
}

export function createAdminSearchClient(client: ApiClient): AdminSearchClient {
  return {
    searchUsers(params?: AdminSearchParams): Promise<SearchResultResponseDto> {
      const qs = buildSearchQs(params);
      return client.request<SearchResultResponseDto>({
        method: 'GET',
        path: `/admin/v1/search/users${qs ? `?${qs}` : ''}`,
      });
    },

    searchContent(params?: AdminSearchParams): Promise<SearchResultResponseDto> {
      const qs = buildSearchQs(params);
      return client.request<SearchResultResponseDto>({
        method: 'GET',
        path: `/admin/v1/search/content${qs ? `?${qs}` : ''}`,
      });
    },

    searchMedia(params?: AdminSearchParams): Promise<SearchResultResponseDto> {
      const qs = buildSearchQs(params);
      return client.request<SearchResultResponseDto>({
        method: 'GET',
        path: `/admin/v1/search/media${qs ? `?${qs}` : ''}`,
      });
    },

    reindex(input?: AdminReindexRequestDto): Promise<AdminReindexResponseDto> {
      return client.request<AdminReindexResponseDto>({
        method: 'POST',
        path: '/admin/v1/search/reindex',
        body: JSON.stringify(input ?? {}),
        headers: { 'Content-Type': 'application/json' },
      });
    },

    tournaments(params?: AdminTournamentSearchParams): Promise<TournamentListResponseDto> {
      const search = new URLSearchParams();
      if (params?.gameId) search.set('gameId', params.gameId);
      if (params?.status) search.set('status', params.status);
      if (params?.format) search.set('format', params.format);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<TournamentListResponseDto>({
        method: 'GET',
        path: `/admin/v1/search/tournaments${qs ? `?${qs}` : ''}`,
      });
    },
  };
}
