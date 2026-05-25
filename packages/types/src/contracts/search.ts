export type SearchScope = 'content' | 'users' | 'media';

export type PublicContentSearchType =
  | 'news'
  | 'article'
  | 'announcement'
  | 'guide'
  | 'rule'
  | 'page';

export interface SearchResultItemDto {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly excerpt?: string;
  readonly slug?: string;
  readonly route?: string;
  readonly status?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface SearchResultResponseDto {
  readonly items: readonly SearchResultItemDto[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface PublicContentSearchQueryDto {
  readonly q?: string;
  readonly type?: PublicContentSearchType;
  readonly categoryId?: string;
  readonly tagId?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminSearchQueryDto {
  readonly q?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminReindexRequestDto {
  readonly scope?: SearchScope;
}

export interface AdminReindexResponseDto {
  readonly queued: boolean;
  readonly message: string;
  readonly scope?: SearchScope;
}
