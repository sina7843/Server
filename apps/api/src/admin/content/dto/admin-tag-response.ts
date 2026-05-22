import type { TagDocument } from '../../../content/tags/tag.schema';
import type { AdminTagDto, AdminTagListResponse, AdminTagResponse } from '@dragon/types';

export function toAdminTagDto(tag: TagDocument): AdminTagDto {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
    slugNormalized: tag.slugNormalized,
    ...(tag.deletedAt ? { deletedAt: tag.deletedAt.toISOString() } : {}),
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}

export function toAdminTagListResponse(items: TagDocument[]): AdminTagListResponse {
  return { items: items.map(toAdminTagDto) };
}

export function toAdminTagResponse(tag: TagDocument): AdminTagResponse {
  return { tag: toAdminTagDto(tag) };
}
