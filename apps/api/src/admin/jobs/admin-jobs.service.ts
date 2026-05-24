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
  ) {}

  private resolveQueue(name: string): Queue | null {
    switch (name) {
      case QueueNames.SMS:
        return this.smsQueue;
      case QueueNames.MEDIA:
        return this.mediaQueue;
      case QueueNames.MAINTENANCE:
        return this.maintenanceQueue;
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

    await this.repository.updateStatus(id, 'retrying', { attempts: log.attempts });

    if (log.bullJobId) {
      const queue = this.resolveQueue(log.queueName);
      if (queue) {
        try {
          const bullJob = await queue.getJob(log.bullJobId);
          if (bullJob) {
            await bullJob.retry();
          }
        } catch (err) {
          this.logger.warn(
            `BullMQ retry failed for job ${log.bullJobId} on queue ${log.queueName}: ${String(err)}`,
          );
        }
      }
    }

    const updated = await this.repository.findById(id);
    return toRetryJobResponseDto(updated ?? log);
  }
}
