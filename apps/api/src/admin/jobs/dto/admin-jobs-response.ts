import type {
  JobLogDto,
  JobLogListItemDto,
  JobLogListResponseDto,
  RetryJobResponseDto,
} from '@dragon/types';
import type { JobLogDocument } from '../../../jobs/job-log.schema';

export function toJobLogListItemDto(doc: JobLogDocument): JobLogListItemDto {
  const item: JobLogListItemDto = {
    id: String(doc._id),
    queueName: doc.queueName,
    jobName: doc.jobName,
    status: doc.status,
    attempts: doc.attempts,
    maxAttempts: doc.maxAttempts,
    createdAt: doc.createdAt.toISOString(),
    ...(doc.error !== undefined ? { error: doc.error } : {}),
    ...(doc.startedAt !== undefined ? { startedAt: doc.startedAt.toISOString() } : {}),
    ...(doc.completedAt !== undefined ? { completedAt: doc.completedAt.toISOString() } : {}),
  };
  return item;
}

export function toJobLogDto(doc: JobLogDocument): JobLogDto {
  return {
    id: String(doc._id),
    queueName: doc.queueName,
    jobName: doc.jobName,
    status: doc.status,
    attempts: doc.attempts,
    maxAttempts: doc.maxAttempts,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(doc.bullJobId !== undefined ? { bullJobId: doc.bullJobId } : {}),
    ...(doc.payloadSummary !== undefined ? { payloadSummary: doc.payloadSummary } : {}),
    ...(doc.error !== undefined ? { error: doc.error } : {}),
    ...(doc.startedAt !== undefined ? { startedAt: doc.startedAt.toISOString() } : {}),
    ...(doc.completedAt !== undefined ? { completedAt: doc.completedAt.toISOString() } : {}),
  };
}

export function toJobLogListResponse(
  items: JobLogDocument[],
  total: number,
  page: number,
  limit: number,
): JobLogListResponseDto {
  return {
    items: items.map(toJobLogListItemDto),
    page,
    limit,
    total,
  };
}

export function toRetryJobResponseDto(doc: JobLogDocument): RetryJobResponseDto {
  return {
    id: String(doc._id),
    status: doc.status,
    attempts: doc.attempts,
    maxAttempts: doc.maxAttempts,
  };
}
