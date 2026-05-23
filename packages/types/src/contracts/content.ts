import type {
  ContentMediaAlignment,
  ContentMediaUsage,
  ContentPostType,
  ContentResourceType,
  ContentStatus,
} from '../constants/content';

// ─── Shared sub-DTOs ────────────────────────────────────────────────────────

export interface ContentSeoDto {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly ogImageMediaId?: string;
}

export interface ContentMediaRefDto {
  readonly mediaId: string;
  readonly usage: ContentMediaUsage;
  readonly alt?: string;
  readonly caption?: string;
  readonly alignment?: ContentMediaAlignment;
}

// ─── Public response DTOs ────────────────────────────────────────────────────

/**
 * bodyHtml is sanitized server-side (Task 0.6.3). Safe to render.
 * Images are not yet supported — bodyHtml will not contain <img> tags until Media API is available.
 */
export interface PublicPostDto {
  readonly id: string;
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly bodyHtml: string;
  readonly categoryIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly seo: ContentSeoDto;
  readonly publishedAt: string;
  readonly createdAt: string;
}

/**
 * bodyHtml is sanitized server-side (Task 0.6.3). Safe to render.
 * Images are not yet supported — bodyHtml will not contain <img> tags until Media API is available.
 */
export interface PublicPageDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly bodyHtml: string;
  readonly seo: ContentSeoDto;
  readonly publishedAt: string;
  readonly createdAt: string;
}

export interface PublicCategoryDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder: number;
}

export interface PublicTagDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

// ─── Public list response envelopes ─────────────────────────────────────────

export interface PublicPostListResponse {
  readonly items: readonly PublicPostDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface PublicPostResponse {
  readonly post: PublicPostDto;
}

export interface PublicPageResponse {
  readonly page: PublicPageDto;
}

export interface PublicCategoryListResponse {
  readonly items: readonly PublicCategoryDto[];
}

export interface PublicCategoryResponse {
  readonly category: PublicCategoryDto;
}

export interface PublicTagListResponse {
  readonly items: readonly PublicTagDto[];
}

export interface PublicTagResponse {
  readonly tag: PublicTagDto;
}

// ─── Admin request DTOs ──────────────────────────────────────────────────────

export interface ContentSeoInput {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
}

export interface CreatePostRequest {
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly categoryIds?: readonly string[];
  readonly tagIds?: readonly string[];
  readonly seo?: ContentSeoInput;
}

export interface UpdatePostRequest {
  readonly title?: string;
  readonly slug?: string;
  readonly excerpt?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly categoryIds?: readonly string[];
  readonly tagIds?: readonly string[];
  readonly seo?: ContentSeoInput;
  readonly coverMediaId?: string | null;
}

export interface CreatePageRequest {
  readonly title: string;
  readonly slug: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly seo?: ContentSeoInput;
}

export interface UpdatePageRequest {
  readonly title?: string;
  readonly slug?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly seo?: ContentSeoInput;
}

export interface CreateCategoryRequest {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder?: number;
}

export interface UpdateCategoryRequest {
  readonly name?: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder?: number;
}

export interface CreateTagRequest {
  readonly name: string;
  readonly slug: string;
}

export interface UpdateTagRequest {
  readonly name?: string;
}

// ─── Admin response DTOs ─────────────────────────────────────────────────────

export interface AdminPostSummaryDto {
  readonly id: string;
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly status: ContentStatus;
  readonly authorId: string;
  readonly publishedAt?: string;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminPostDetailDto {
  readonly id: string;
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly slugHistory: readonly string[];
  readonly excerpt?: string;
  readonly bodyJson: Record<string, unknown>;
  readonly bodyHtml: string;
  readonly status: ContentStatus;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly seo: ContentSeoDto;
  readonly viewCount: number;
  readonly coverMediaId?: string;
  readonly publishedAt?: string;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminPageSummaryDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: ContentStatus;
  readonly createdBy: string;
  readonly publishedAt?: string;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminPageDetailDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly slugHistory: readonly string[];
  readonly bodyJson: Record<string, unknown>;
  readonly bodyHtml: string;
  readonly status: ContentStatus;
  readonly createdBy: string;
  readonly seo: ContentSeoDto;
  readonly publishedAt?: string;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminCategoryDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder: number;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminTagDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly deletedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Admin list response envelopes ───────────────────────────────────────────

export interface AdminPostListResponse {
  readonly items: readonly AdminPostSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminPostResponse {
  readonly post: AdminPostDetailDto;
}

export interface AdminPageListResponse {
  readonly items: readonly AdminPageSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminPageResponse {
  readonly page: AdminPageDetailDto;
}

export interface AdminCategoryListResponse {
  readonly items: readonly AdminCategoryDto[];
}

export interface AdminCategoryResponse {
  readonly category: AdminCategoryDto;
}

export interface AdminTagListResponse {
  readonly items: readonly AdminTagDto[];
}

export interface AdminTagResponse {
  readonly tag: AdminTagDto;
}

// ─── Revision DTOs ───────────────────────────────────────────────────────────

export interface ContentRevisionSummary {
  readonly id: string;
  readonly resourceType: ContentResourceType;
  readonly resourceId: string;
  readonly revisionNumber: number;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface ContentRevisionDetailDto extends ContentRevisionSummary {
  readonly snapshot: Record<string, unknown>;
}

export interface ContentRevisionListResponse {
  readonly revisions: readonly ContentRevisionSummary[];
}

export interface ContentRevisionResponse {
  readonly revision: ContentRevisionDetailDto;
}

// ─── Generic response ────────────────────────────────────────────────────────

export interface ContentGenericResponse {
  readonly success: true;
  readonly message: string;
}

// ─── Legacy summaries (kept for backward compatibility) ──────────────────────

export interface ContentPostSummary {
  readonly id: string;
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly status: ContentStatus;
  readonly authorId: string;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ContentPageSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: ContentStatus;
  readonly createdBy: string;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ContentCategorySummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder: number;
}

export interface ContentTagSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}
