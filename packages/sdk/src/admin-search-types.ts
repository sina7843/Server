import type {
  AdminSearchQueryDto,
  AdminReindexRequestDto,
  AdminReindexResponseDto,
  SearchResultResponseDto,
  TournamentListQueryDto,
  TournamentListResponseDto,
} from '@dragon/types';

export type AdminSearchParams = AdminSearchQueryDto;
export type AdminTournamentSearchParams = TournamentListQueryDto;

export interface AdminSearchClient {
  searchUsers(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchContent(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchMedia(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  reindex(input?: AdminReindexRequestDto): Promise<AdminReindexResponseDto>;
  tournaments(params?: AdminTournamentSearchParams): Promise<TournamentListResponseDto>;
}
