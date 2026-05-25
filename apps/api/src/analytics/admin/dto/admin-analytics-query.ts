import { BadRequestException } from '@nestjs/common';
import type { AnalyticsDateFilter } from '../../analytics.types';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

export interface AdminAnalyticsQueryDto {
  readonly filter: AnalyticsDateFilter;
  readonly limit: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export function parseAdminAnalyticsQuery(raw: unknown): AdminAnalyticsQueryDto {
  const q = raw as Record<string, unknown>;

  let dateFrom: Date | undefined;
  if (q.dateFrom !== undefined) {
    if (typeof q.dateFrom !== 'string' || Number.isNaN(Date.parse(q.dateFrom))) {
      throw new BadRequestException('dateFrom must be a valid ISO date string.');
    }
    dateFrom = new Date(q.dateFrom);
  }

  let dateTo: Date | undefined;
  if (q.dateTo !== undefined) {
    if (typeof q.dateTo !== 'string' || Number.isNaN(Date.parse(q.dateTo))) {
      throw new BadRequestException('dateTo must be a valid ISO date string.');
    }
    dateTo = new Date(q.dateTo);
  }

  if (dateFrom !== undefined && dateTo !== undefined && dateFrom > dateTo) {
    throw new BadRequestException('dateFrom must not be after dateTo.');
  }

  const limitRaw = q.limit !== undefined ? Number(q.limit) : DEFAULT_LIMIT;
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    filter: {
      ...(dateFrom !== undefined ? { dateFrom } : {}),
      ...(dateTo !== undefined ? { dateTo } : {}),
    },
    limit: limitRaw,
    ...(q.dateFrom !== undefined ? { dateFrom: String(q.dateFrom) } : {}),
    ...(q.dateTo !== undefined ? { dateTo: String(q.dateTo) } : {}),
  };
}
