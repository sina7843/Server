import type {
  PublicContentSearchQueryDto,
  SearchResultResponseDto,
  TournamentListQueryDto,
  TournamentListResponseDto,
} from '@dragon/types';

export type SearchContentParams = PublicContentSearchQueryDto;
export type TournamentSearchParams = TournamentListQueryDto;

export interface SearchClient {
  searchContent(params?: SearchContentParams): Promise<SearchResultResponseDto>;
  tournaments(params?: TournamentSearchParams): Promise<TournamentListResponseDto>;
}
