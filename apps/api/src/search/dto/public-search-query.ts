import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CONTENT_POST_TYPES, type ContentPostType } from '@dragon/types';
import type { ParsedPublicContentSearchQuery } from '../search.service';

const PUBLIC_CONTENT_SEARCH_TYPES = [...CONTENT_POST_TYPES, 'page'] as const;
type PublicContentSearchType = (typeof PUBLIC_CONTENT_SEARCH_TYPES)[number];

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const MAX_Q_LENGTH = 200;

export function parsePublicContentSearchQuery(raw: unknown): ParsedPublicContentSearchQuery {
  const query = raw as Record<string, unknown>;

  let q: string | undefined;
  if (query.q !== undefined && query.q !== '') {
    if (typeof query.q !== 'string') throw new BadRequestException('q must be a string.');
    if (query.q.length > MAX_Q_LENGTH)
      throw new BadRequestException(`q must be at most ${MAX_Q_LENGTH} characters.`);
    q = query.q.trim() || undefined;
  }

  let type: ContentPostType | 'page' | undefined;
  if (query.type !== undefined) {
    if (!(PUBLIC_CONTENT_SEARCH_TYPES as readonly unknown[]).includes(query.type)) {
      throw new BadRequestException(
        `type must be one of: ${PUBLIC_CONTENT_SEARCH_TYPES.join(', ')}.`,
      );
    }
    type = query.type as PublicContentSearchType;
  }

  let categoryId: string | undefined;
  if (query.categoryId !== undefined) {
    if (typeof query.categoryId !== 'string' || !Types.ObjectId.isValid(query.categoryId)) {
      throw new BadRequestException('categoryId must be a valid ObjectId.');
    }
    categoryId = query.categoryId;
  }

  let tagId: string | undefined;
  if (query.tagId !== undefined) {
    if (typeof query.tagId !== 'string' || !Types.ObjectId.isValid(query.tagId)) {
      throw new BadRequestException('tagId must be a valid ObjectId.');
    }
    tagId = query.tagId;
  }

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1)
    throw new BadRequestException('page must be a positive integer.');

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT)
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);

  return {
    ...(q !== undefined ? { q } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(tagId !== undefined ? { tagId } : {}),
    page: pageRaw,
    limit: limitRaw,
  };
}
