import { BadRequestException } from '@nestjs/common';
import type { ParsedAdminSearchQuery } from '../search.service';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const MAX_Q_LENGTH = 200;

export function parseAdminSearchQuery(raw: unknown): ParsedAdminSearchQuery {
  const query = raw as Record<string, unknown>;

  let q: string | undefined;
  if (query.q !== undefined && query.q !== '') {
    if (typeof query.q !== 'string') throw new BadRequestException('q must be a string.');
    if (query.q.length > MAX_Q_LENGTH)
      throw new BadRequestException(`q must be at most ${MAX_Q_LENGTH} characters.`);
    q = query.q.trim() || undefined;
  }

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1)
    throw new BadRequestException('page must be a positive integer.');

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT)
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);

  return {
    ...(q !== undefined ? { q } : {}),
    page: pageRaw,
    limit: limitRaw,
  };
}
