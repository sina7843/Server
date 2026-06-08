import type { PostDocument } from '../../posts/post.schema';
import type { PublicPostDto, PublicPostListResponse, PublicPostResponse } from '@dragon/types';

export interface PostEnrichment {
  authorName?: string;
  coverImageUrl?: string;
}

export interface EnrichedPost {
  post: PostDocument;
  authorName?: string;
  coverImageUrl?: string;
}

export function toPublicPostDto(post: PostDocument, enrichment: PostEnrichment = {}): PublicPostDto {
  return {
    id: String(post._id),
    type: post.type,
    title: post.title,
    slug: post.slug,
    ...(post.excerpt ? { excerpt: post.excerpt } : {}),
    bodyHtml: post.bodyHtml ?? '',
    categoryIds: (post.categoryIds ?? []).map(String),
    tagIds: (post.tagIds ?? []).map(String),
    viewCount: post.viewCount ?? 0,
    ...(enrichment.authorName ? { authorName: enrichment.authorName } : {}),
    ...(enrichment.coverImageUrl ? { coverImageUrl: enrichment.coverImageUrl } : {}),
    seo: {
      ...(post.seo?.title ? { title: post.seo.title } : {}),
      ...(post.seo?.description ? { description: post.seo.description } : {}),
      ...(post.seo?.canonicalUrl ? { canonicalUrl: post.seo.canonicalUrl } : {}),
      ...(post.seo?.noIndex !== undefined ? { noIndex: post.seo.noIndex } : {}),
    },
    publishedAt: post.publishedAt!.toISOString(),
    createdAt: post.createdAt.toISOString(),
  };
}

export function toPublicPostResponse(enriched: EnrichedPost): PublicPostResponse {
  return { post: toPublicPostDto(enriched.post, enriched) };
}

export function toPublicPostListResponse(
  enriched: EnrichedPost[],
  total: number,
  page: number,
  limit: number,
): PublicPostListResponse {
  return {
    items: enriched.map(({ post, authorName, coverImageUrl }) =>
      toPublicPostDto(post, {
        ...(authorName !== undefined ? { authorName } : {}),
        ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
      }),
    ),
    total,
    page,
    limit,
  };
}
