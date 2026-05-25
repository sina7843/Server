import type {
  AdminSearchQueryDto,
  AdminReindexRequestDto,
  AdminReindexResponseDto,
  SearchResultResponseDto,
} from '@dragon/types';

export type AdminSearchParams = AdminSearchQueryDto;

export interface AdminSearchClient {
  searchUsers(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchContent(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  searchMedia(params?: AdminSearchParams): Promise<SearchResultResponseDto>;
  reindex(input?: AdminReindexRequestDto): Promise<AdminReindexResponseDto>;
}
