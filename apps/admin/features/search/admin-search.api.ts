import { createAdminSearchClient } from '@dragon/sdk';
import type { ApiClient, AdminSearchParams } from '@dragon/sdk';
import type {
  AdminReindexRequestDto,
  AdminReindexResponseDto,
  SearchResultResponseDto,
} from '@dragon/types';

export async function searchUsers(
  client: ApiClient,
  params?: AdminSearchParams,
): Promise<SearchResultResponseDto> {
  return createAdminSearchClient(client).searchUsers(params);
}

export async function searchContent(
  client: ApiClient,
  params?: AdminSearchParams,
): Promise<SearchResultResponseDto> {
  return createAdminSearchClient(client).searchContent(params);
}

export async function searchMedia(
  client: ApiClient,
  params?: AdminSearchParams,
): Promise<SearchResultResponseDto> {
  return createAdminSearchClient(client).searchMedia(params);
}

export async function reindex(
  client: ApiClient,
  input?: AdminReindexRequestDto,
): Promise<AdminReindexResponseDto> {
  return createAdminSearchClient(client).reindex(input);
}
