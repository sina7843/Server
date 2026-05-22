import { BadRequestException } from '@nestjs/common';
import {
  CONTENT_POST_TYPES,
  CONTENT_STATUSES,
  type ContentPostType,
  type ContentStatus,
} from '@dragon/types';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

export interface AdminContentListQueryDto {
  readonly type?: ContentPostType;
  readonly status?: ContentStatus;
  readonly includeDeleted: boolean;
  readonly page: number;
  readonly limit: number;
}

export function parseAdminContentListQuery(raw: unknown): AdminContentListQueryDto {
  const query = raw as Record<string, unknown>;

  let type: ContentPostType | undefined;
  if (query.type !== undefined) {
    if (!(CONTENT_POST_TYPES as readonly unknown[]).includes(query.type)) {
      throw new BadRequestException(`type must be one of: ${CONTENT_POST_TYPES.join(', ')}.`);
    }
    type = query.type as ContentPostType;
  }

  let status: ContentStatus | undefined;
  if (query.status !== undefined) {
    if (!(CONTENT_STATUSES as readonly unknown[]).includes(query.status)) {
      throw new BadRequestException(`status must be one of: ${CONTENT_STATUSES.join(', ')}.`);
    }
    status = query.status as ContentStatus;
  }

  const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    ...(type !== undefined ? { type } : {}),
    ...(status !== undefined ? { status } : {}),
    includeDeleted,
    page: pageRaw,
    limit: limitRaw,
  };
}

export interface AdminPageListQueryDto {
  readonly status?: ContentStatus;
  readonly includeDeleted: boolean;
  readonly page: number;
  readonly limit: number;
}

export function parseAdminPageListQuery(raw: unknown): AdminPageListQueryDto {
  const query = raw as Record<string, unknown>;

  let status: ContentStatus | undefined;
  if (query.status !== undefined) {
    if (!(CONTENT_STATUSES as readonly unknown[]).includes(query.status)) {
      throw new BadRequestException(`status must be one of: ${CONTENT_STATUSES.join(', ')}.`);
    }
    status = query.status as ContentStatus;
  }

  const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    ...(status !== undefined ? { status } : {}),
    includeDeleted,
    page: pageRaw,
    limit: limitRaw,
  };
}
