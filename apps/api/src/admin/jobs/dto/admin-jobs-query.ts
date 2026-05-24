import { BadRequestException } from '@nestjs/common';
import { JOB_STATUSES, type JobStatus } from '../../../jobs/job-log.schema';
import type { JobLogFilters } from '../../../jobs/job-log.repository';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

export interface AdminJobsQueryDto {
  readonly filters: JobLogFilters;
  readonly page: number;
  readonly limit: number;
}

export function parseAdminJobsQuery(raw: unknown): AdminJobsQueryDto {
  const q = raw as Record<string, unknown>;

  let queueName: string | undefined;
  if (q.queueName !== undefined) {
    if (typeof q.queueName !== 'string' || q.queueName.trim().length === 0) {
      throw new BadRequestException('queueName must be a non-empty string.');
    }
    queueName = q.queueName.trim();
  }

  let jobName: string | undefined;
  if (q.jobName !== undefined) {
    if (typeof q.jobName !== 'string' || q.jobName.trim().length === 0) {
      throw new BadRequestException('jobName must be a non-empty string.');
    }
    jobName = q.jobName.trim();
  }

  let status: JobStatus | undefined;
  if (q.status !== undefined) {
    if (!JOB_STATUSES.includes(q.status as JobStatus)) {
      throw new BadRequestException(`status must be one of: ${JOB_STATUSES.join(', ')}.`);
    }
    status = q.status as JobStatus;
  }

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

  const pageRaw = q.page !== undefined ? Number(q.page) : DEFAULT_PAGE;
  const limitRaw = q.limit !== undefined ? Number(q.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    filters: {
      ...(queueName !== undefined ? { queueName } : {}),
      ...(jobName !== undefined ? { jobName } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(dateFrom !== undefined ? { dateFrom } : {}),
      ...(dateTo !== undefined ? { dateTo } : {}),
    },
    page: pageRaw,
    limit: limitRaw,
  };
}
