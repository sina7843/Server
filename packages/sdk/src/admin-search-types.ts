import type {
  AdminSearchQueryDto,
  AdminReindexRequestDto,
  AdminReindexResponseDto,
  SearchResultResponseDto,
  TournamentSearchQueryDto,
  TournamentListResponseDto,
} from '@dragon/types';

export type AdminSearchParams = AdminSearchQueryDto;
export type AdminTournamentSearchParams = TournamentSearchQueryDto;

export interface AdminSearchClient {
  searchUsers(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchContent(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchMedia(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  reindex(input?: AdminReindexRequestDto): Promise<AdminReindexResponseDto>;
  tournaments(params?: AdminTournamentSearchParams): Promise<TournamentListResponseDto>;
}
