import type { ApiClient } from './client';
import type { SearchClient, SearchContentParams } from './search-types';
import type { SearchResultResponseDto } from '@dragon/types';

export function createSearchClient(client: ApiClient): SearchClient {
  return {
    searchContent(params?: SearchContentParams): Promise<SearchResultResponseDto> {
      const search = new URLSearchParams();
      if (params?.q) search.set('q', params.q);
      if (params?.type) search.set('type', params.type);
      if (params?.categoryId) search.set('categoryId', params.categoryId);
      if (params?.tagId) search.set('tagId', params.tagId);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<SearchResultResponseDto>({
        method: 'GET',
        path: `/api/v1/search/content${qs ? `?${qs}` : ''}`,
      });
    },
  };
}
