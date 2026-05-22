import type { PageDocument } from '../../../content/pages/page.schema';
import type {
  AdminPageDetailDto,
  AdminPageListResponse,
  AdminPageResponse,
  AdminPageSummaryDto,
} from '@dragon/types';

export function toAdminPageSummary(page: PageDocument): AdminPageSummaryDto {
  return {
    id: String(page._id),
    title: page.title,
    slug: page.slug,
    status: page.status,
    createdBy: String(page.createdBy),
    ...(page.publishedAt ? { publishedAt: page.publishedAt.toISOString() } : {}),
    ...(page.deletedAt ? { deletedAt: page.deletedAt.toISOString() } : {}),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toAdminPageDetail(page: PageDocument): AdminPageDetailDto {
  return {
    id: String(page._id),
    title: page.title,
    slug: page.slug,
    slugNormalized: page.slugNormalized,
    slugHistory: page.slugHistory ?? [],
    bodyJson: page.bodyJson ?? {},
    bodyHtml: page.bodyHtml ?? '',
    status: page.status,
    createdBy: String(page.createdBy),
    seo: {
      ...(page.seo?.title ? { title: page.seo.title } : {}),
      ...(page.seo?.description ? { description: page.seo.description } : {}),
      ...(page.seo?.canonicalUrl ? { canonicalUrl: page.seo.canonicalUrl } : {}),
      ...(page.seo?.noIndex !== undefined ? { noIndex: page.seo.noIndex } : {}),
    },
    ...(page.publishedAt ? { publishedAt: page.publishedAt.toISOString() } : {}),
    ...(page.deletedAt ? { deletedAt: page.deletedAt.toISOString() } : {}),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toAdminPageListResponse(
  items: PageDocument[],
  total: number,
  page: number,
  limit: number,
): AdminPageListResponse {
  return { items: items.map(toAdminPageSummary), total, page, limit };
}

export function toAdminPageResponse(page: PageDocument): AdminPageResponse {
  return { page: toAdminPageDetail(page) };
}
