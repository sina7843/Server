import type { PostDocument } from '../../posts/post.schema';
import type { PublicPostDto, PublicPostListResponse, PublicPostResponse } from '@dragon/types';

export function toPublicPostDto(post: PostDocument): PublicPostDto {
  return {
    id: String(post._id),
    type: post.type,
    title: post.title,
    slug: post.slug,
    ...(post.excerpt ? { excerpt: post.excerpt } : {}),
    bodyHtml: post.bodyHtml ?? '',
    categoryIds: (post.categoryIds ?? []).map(String),
    tagIds: (post.tagIds ?? []).map(String),
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

export function toPublicPostListResponse(
  items: PostDocument[],
  total: number,
  page: number,
  limit: number,
): PublicPostListResponse {
  return { items: items.map(toPublicPostDto), total, page, limit };
}

export function toPublicPostResponse(post: PostDocument): PublicPostResponse {
  return { post: toPublicPostDto(post) };
}
