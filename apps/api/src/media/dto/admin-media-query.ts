import { BadRequestException } from '@nestjs/common';
import {
  MEDIA_ASSET_STATUSES,
  MEDIA_VISIBILITIES,
  type MediaAssetStatus,
  type MediaVisibility,
} from '@dragon/types';

export interface AdminMediaListQueryDto {
  readonly visibility?: MediaVisibility;
  readonly status?: MediaAssetStatus;
  readonly mimeType?: string;
  readonly page: number;
  readonly limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parseAdminMediaListQuery(raw: unknown): AdminMediaListQueryDto {
  if (typeof raw !== 'object' || raw === null) {
    return { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT };
  }
  const q = raw as Record<string, unknown>;

  const rawPage = Number(q['page'] ?? DEFAULT_PAGE);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;

  const rawLimit = Number(q['limit'] ?? DEFAULT_LIMIT);
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  let visibility: MediaVisibility | undefined;
  if (q['visibility'] !== undefined) {
    if (!(MEDIA_VISIBILITIES as readonly unknown[]).includes(q['visibility'])) {
      throw new BadRequestException(`visibility must be one of: ${MEDIA_VISIBILITIES.join(', ')}.`);
    }
    visibility = q['visibility'] as MediaVisibility;
  }

  let status: MediaAssetStatus | undefined;
  if (q['status'] !== undefined) {
    if (!(MEDIA_ASSET_STATUSES as readonly unknown[]).includes(q['status'])) {
      throw new BadRequestException(`status must be one of: ${MEDIA_ASSET_STATUSES.join(', ')}.`);
    }
    status = q['status'] as MediaAssetStatus;
  }

  const mimeType =
    typeof q['mimeType'] === 'string' ? q['mimeType'].trim() || undefined : undefined;

  return {
    ...(visibility !== undefined ? { visibility } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(mimeType !== undefined ? { mimeType } : {}),
    page,
    limit,
  };
}
