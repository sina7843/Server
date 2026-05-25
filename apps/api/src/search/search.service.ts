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

export abstract class SearchService {
  abstract searchPublicContent(query: ParsedPublicContentSearchQuery): Promise<SearchResult>;
  abstract searchAdminContent(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract searchAdminUsers(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract searchAdminMedia(query: ParsedAdminSearchQuery): Promise<SearchResult>;
  abstract reindex(scope?: SearchScope): Promise<void>;
}
