import type { PublicContentSearchQueryDto, SearchResultResponseDto } from '@dragon/types';

export type SearchContentParams = PublicContentSearchQueryDto;

export interface SearchClient {
  searchContent(params?: SearchContentParams): Promise<SearchResultResponseDto>;
}
