import type { PageDocument } from '../../pages/page.schema';
import type { PublicPageDto, PublicPageResponse } from '@dragon/types';

export function toPublicPageDto(page: PageDocument): PublicPageDto {
  return {
    id: String(page._id),
    title: page.title,
    slug: page.slug,
    bodyHtml: page.bodyHtml ?? '',
    seo: {
      ...(page.seo?.title ? { title: page.seo.title } : {}),
      ...(page.seo?.description ? { description: page.seo.description } : {}),
      ...(page.seo?.canonicalUrl ? { canonicalUrl: page.seo.canonicalUrl } : {}),
      ...(page.seo?.noIndex !== undefined ? { noIndex: page.seo.noIndex } : {}),
    },
    publishedAt: page.publishedAt!.toISOString(),
    createdAt: page.createdAt.toISOString(),
  };
}

export function toPublicPageResponse(page: PageDocument): PublicPageResponse {
  return { page: toPublicPageDto(page) };
}
