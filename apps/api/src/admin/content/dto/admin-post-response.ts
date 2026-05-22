import type { PostDocument } from '../../../content/posts/post.schema';
import type { ContentRevisionDocument } from '../../../content/revisions/content-revision.schema';
import type {
  AdminPostDetailDto,
  AdminPostListResponse,
  AdminPostResponse,
  AdminPostSummaryDto,
  ContentRevisionDetailDto,
  ContentRevisionListResponse,
  ContentRevisionSummary,
} from '@dragon/types';

export function toAdminPostSummary(post: PostDocument): AdminPostSummaryDto {
  return {
    id: String(post._id),
    type: post.type,
    title: post.title,
    slug: post.slug,
    status: post.status,
    authorId: String(post.authorId),
    ...(post.publishedAt ? { publishedAt: post.publishedAt.toISOString() } : {}),
    ...(post.deletedAt ? { deletedAt: post.deletedAt.toISOString() } : {}),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toAdminPostDetail(post: PostDocument): AdminPostDetailDto {
  return {
    id: String(post._id),
    type: post.type,
    title: post.title,
    slug: post.slug,
    slugNormalized: post.slugNormalized,
    slugHistory: post.slugHistory ?? [],
    ...(post.excerpt ? { excerpt: post.excerpt } : {}),
    bodyJson: post.bodyJson ?? {},
    bodyHtml: post.bodyHtml ?? '',
    status: post.status,
    authorId: String(post.authorId),
    categoryIds: (post.categoryIds ?? []).map(String),
    tagIds: (post.tagIds ?? []).map(String),
    seo: {
      ...(post.seo?.title ? { title: post.seo.title } : {}),
      ...(post.seo?.description ? { description: post.seo.description } : {}),
      ...(post.seo?.canonicalUrl ? { canonicalUrl: post.seo.canonicalUrl } : {}),
      ...(post.seo?.noIndex !== undefined ? { noIndex: post.seo.noIndex } : {}),
    },
    viewCount: post.viewCount ?? 0,
    ...(post.publishedAt ? { publishedAt: post.publishedAt.toISOString() } : {}),
    ...(post.deletedAt ? { deletedAt: post.deletedAt.toISOString() } : {}),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toAdminPostListResponse(
  items: PostDocument[],
  total: number,
  page: number,
  limit: number,
): AdminPostListResponse {
  return { items: items.map(toAdminPostSummary), total, page, limit };
}

export function toAdminPostResponse(post: PostDocument): AdminPostResponse {
  return { post: toAdminPostDetail(post) };
}

export function toRevisionSummary(rev: ContentRevisionDocument): ContentRevisionSummary {
  return {
    id: String(rev._id),
    resourceType: rev.resourceType,
    resourceId: String(rev.resourceId),
    revisionNumber: rev.revisionNumber,
    createdBy: String(rev.createdBy),
    createdAt: rev.createdAt.toISOString(),
  };
}

export function toRevisionDetail(rev: ContentRevisionDocument): ContentRevisionDetailDto {
  return {
    ...toRevisionSummary(rev),
    snapshot: rev.snapshot ?? {},
  };
}

export function toRevisionListResponse(
  revs: ContentRevisionDocument[],
): ContentRevisionListResponse {
  return { revisions: revs.map(toRevisionSummary) };
}
