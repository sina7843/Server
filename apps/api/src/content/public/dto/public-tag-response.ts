import type { TagDocument } from '../../tags/tag.schema';
import type { PublicTagDto, PublicTagListResponse, PublicTagResponse } from '@dragon/types';

export function toPublicTagDto(tag: TagDocument): PublicTagDto {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
  };
}

export function toPublicTagListResponse(items: TagDocument[]): PublicTagListResponse {
  return { items: items.map(toPublicTagDto) };
}

export function toPublicTagResponse(tag: TagDocument): PublicTagResponse {
  return { tag: toPublicTagDto(tag) };
}
