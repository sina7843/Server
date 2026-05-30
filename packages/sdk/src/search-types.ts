import type {
  PublicContentSearchQueryDto,
  SearchResultResponseDto,
  TournamentSearchQueryDto,
  TournamentListResponseDto,
} from '@dragon/types';

export type SearchContentParams = PublicContentSearchQueryDto;
export type TournamentSearchParams = TournamentSearchQueryDto;

export interface SearchClient {
  searchContent(params?: SearchContentParams): Promise<SearchResultResponseDto>;
  tournaments(params?: TournamentSearchParams): Promise<TournamentListResponseDto>;
}
