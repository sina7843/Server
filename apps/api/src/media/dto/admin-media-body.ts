import { BadRequestException } from '@nestjs/common';
import { MEDIA_VISIBILITIES, type MediaVisibility } from '@dragon/types';
import type { UpdateMediaAssetMetadataInput } from '../media-asset.types';

export interface AdminMediaUploadMetadataDto {
  readonly visibility: MediaVisibility;
  readonly alt?: string;
  readonly caption?: string;
}

export function parseUploadMetadata(body: unknown): AdminMediaUploadMetadataDto {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

  let visibility: MediaVisibility = 'public';
  if (b['visibility'] !== undefined) {
    if (!(MEDIA_VISIBILITIES as readonly unknown[]).includes(b['visibility'])) {
      throw new BadRequestException(`visibility must be one of: ${MEDIA_VISIBILITIES.join(', ')}.`);
    }
    visibility = b['visibility'] as MediaVisibility;
  }

  const alt = typeof b['alt'] === 'string' ? b['alt'].trim().slice(0, 500) || undefined : undefined;
  const caption =
    typeof b['caption'] === 'string' ? b['caption'].trim().slice(0, 1000) || undefined : undefined;

  return {
    visibility,
    ...(alt !== undefined ? { alt } : {}),
    ...(caption !== undefined ? { caption } : {}),
  };
}

export function parseUpdateMediaBody(body: unknown): UpdateMediaAssetMetadataInput {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be a JSON object.');
  }
  const b = body as Record<string, unknown>;

  const knownFields = new Set(['visibility', 'alt', 'caption']);
  const unknownFields = Object.keys(b).filter((k) => !knownFields.has(k));
  if (unknownFields.length > 0) {
    throw new BadRequestException(`Unknown fields: ${unknownFields.join(', ')}.`);
  }

  let visibility: MediaVisibility | undefined;
  if (b['visibility'] !== undefined) {
    if (!(MEDIA_VISIBILITIES as readonly unknown[]).includes(b['visibility'])) {
      throw new BadRequestException(`visibility must be one of: ${MEDIA_VISIBILITIES.join(', ')}.`);
    }
    visibility = b['visibility'] as MediaVisibility;
  }

  const alt = typeof b['alt'] === 'string' ? b['alt'].trim().slice(0, 500) || undefined : undefined;
  const caption =
    typeof b['caption'] === 'string' ? b['caption'].trim().slice(0, 1000) || undefined : undefined;

  return {
    ...(visibility !== undefined ? { visibility } : {}),
    ...(alt !== undefined ? { alt } : {}),
    ...(caption !== undefined ? { caption } : {}),
  };
}
