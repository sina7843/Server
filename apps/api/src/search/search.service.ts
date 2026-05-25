import type { SearchScope, SearchResultItemDto } from '@dragon/types';

export interface SearchResult {
  readonly items: readonly SearchResultItemDto[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface ParsedPublicContentSearchQuery {
  readonly q?: string;
  readonly type?: string;
  readonly categoryId?: string;
  readonly tagId?: string;
  readonly page: number;
  readonly limit: number;
}

export interface ParsedAdminSearchQuery {
  readonly q?: string;
  readonly page: number;
  readonly limit: number;
}

export interface IndexSearchInput {
  readonly type: string;
  readonly id: string;
}

export interface RemoveSearchInput {
  readonly type: string;
  readonly id: string;
}

export type SearchInput =
  | { readonly kind: 'public_content'; readonly query: ParsedPublicContentSearchQuery }
  | { readonly kind: 'admin_content'; readonly query: ParsedAdminSearchQuery }
  | { readonly kind: 'admin_users'; readonly query: ParsedAdminSearchQuery }
  | { readonly kind: 'admin_media'; readonly query: ParsedAdminSearchQuery };

export abstract class SearchService {
  abstract searchPublicContent(query: ParsedPublicContentSearchQuery): Promise<SearchResult>;
  abstract searchAdminContent(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract searchAdminUsers(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract searchAdminMedia(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract search(input: SearchInput): Promise<SearchResult>;
  abstract index(input: IndexSearchInput): Promise<void>;
  abstract remove(input: RemoveSearchInput): Promise<void>;
  abstract reindex(scope?: SearchScope): Promise<void>;
}
