import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { JobLogDto, JobLogListResponseDto, RetryJobResponseDto } from '@dragon/types';
import { JobLogRepository } from '../../jobs/job-log.repository';
import { QueueNames } from '../../jobs/queue-registry';
import type { AdminJobsQueryDto } from './dto/admin-jobs-query';
import {
  toJobLogDto,
  toJobLogListResponse,
  toRetryJobResponseDto,
} from './dto/admin-jobs-response';
import { validateObjectId } from '../../rbac/dto/rbac-validation';

@Injectable()
export class AdminJobsService {
  private readonly logger = new Logger(AdminJobsService.name);

  constructor(
    private readonly repository: JobLogRepository,
    @InjectQueue(QueueNames.SMS) private readonly smsQueue: Queue,
    @InjectQueue(QueueNames.MEDIA) private readonly mediaQueue: Queue,
    @InjectQueue(QueueNames.MAINTENANCE) private readonly maintenanceQueue: Queue,
    @InjectQueue(QueueNames.SEARCH) private readonly searchQueue: Queue,
  ) {}

  private resolveQueue(name: string): Queue | null {
    switch (name) {
      case QueueNames.SMS:
        return this.smsQueue;
      case QueueNames.MEDIA:
        return this.mediaQueue;
      case QueueNames.MAINTENANCE:
        return this.maintenanceQueue;
      case QueueNames.SEARCH:
        return this.searchQueue;
      default:
        return null;
    }
  }

  async listJobs(query: AdminJobsQueryDto): Promise<JobLogListResponseDto> {
    const { items, total } = await this.repository.list(query.filters, query.page, query.limit);
    return toJobLogListResponse(items, total, query.page, query.limit);
  }

  async getJob(rawId: string): Promise<JobLogDto> {
    const id = validateObjectId(rawId, 'id');
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundException('Job not found.');
    }
    return toJobLogDto(log);
  }

  async retryJob(rawId: string): Promise<RetryJobResponseDto> {
    const id = validateObjectId(rawId, 'id');
    const log = await this.repository.findById(id);

    if (!log) {
      throw new NotFoundException('Job not found.');
    }

    if (log.status !== 'failed') {
      throw new BadRequestException('Only failed jobs can be retried.');
    }

    if (log.attempts >= log.maxAttempts) {
      throw new BadRequestException(
        `Job has reached its maximum attempt limit (${log.maxAttempts}).`,
      );
    }

    if (!log.bullJobId) {
      throw new BadRequestException('Job cannot be retried: BullMQ job ID is missing.');
    }

    const queue = this.resolveQueue(log.queueName);
    if (!queue) {
      throw new BadRequestException(
        `Job cannot be retried: queue '${log.queueName}' is not registered.`,
      );
    }

    const bullJob = await queue.getJob(log.bullJobId);
    if (!bullJob) {
      throw new BadRequestException('Job cannot be retried: BullMQ job not found in queue.');
    }

    try {
      await bullJob.retry();
    } catch (err) {
      this.logger.warn(
        `BullMQ retry failed for job ${log.bullJobId} on queue ${log.queueName}: ${String(err)}`,
      );
      await this.repository.updateStatus(id, 'failed', {
        attempts: log.attempts,
        error: 'Retry attempt failed; job remains in failed state.',
      });
      throw new BadRequestException('Failed to enqueue retry. Job remains in failed state.');
    }

    await this.repository.updateStatus(id, 'retrying', { attempts: log.attempts });

    const updated = await this.repository.findById(id);
    return toRetryJobResponseDto(updated ?? log);
  }
}
