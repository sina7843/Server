import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { type JobLogDocument } from './job-log.schema';
import { JobLogRepository, type JobLogFilters } from './job-log.repository';
import { JobPayloadRedactor } from './job-payload-redactor';
import { QueueNames, type QueueName } from './queue-registry';

export interface EnqueueJobInput {
  readonly queueName: QueueName;
  readonly jobName: string;
  readonly payload: object;
  readonly maxAttempts?: number;
}

@Injectable()
export class JobLogService {
  private readonly logger = new Logger(JobLogService.name);

  constructor(
    private readonly repository: JobLogRepository,
    private readonly redactor: JobPayloadRedactor,
    @InjectQueue(QueueNames.SMS) private readonly smsQueue: Queue,
    @InjectQueue(QueueNames.MEDIA) private readonly mediaQueue: Queue,
    @InjectQueue(QueueNames.MAINTENANCE) private readonly maintenanceQueue: Queue,
  ) {}

  private resolveQueue(name: QueueName): Queue {
    switch (name) {
      case QueueNames.SMS:
        return this.smsQueue;
      case QueueNames.MEDIA:
        return this.mediaQueue;
      case QueueNames.MAINTENANCE:
        return this.maintenanceQueue;
      default:
        throw new Error(`No injected queue for: ${String(name)}`);
    }
  }

  async enqueue(input: EnqueueJobInput): Promise<JobLogDocument> {
    const maxAttempts = input.maxAttempts ?? 3;
    const payloadSummary = this.redactor.redact(input.payload);

    const jobLog = await this.repository.create({
      queueName: input.queueName,
      jobName: input.jobName,
      maxAttempts,
      payloadSummary,
    });

    const jobLogId = String(jobLog._id);

    try {
      const queue = this.resolveQueue(input.queueName);
      const bullJob = await queue.add(
        input.jobName,
        { jobLogId, ...input.payload },
        {
          attempts: maxAttempts,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      await this.repository.updateStatus(jobLogId, 'queued', {
        bullJobId: String(bullJob.id),
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue ${input.jobName} on queue ${input.queueName}`,
        String(err),
      );
      await this.repository
        .updateStatus(jobLogId, 'failed', {
          error: err instanceof Error ? err.message : String(err),
        })
        .catch(() => {});
      throw err;
    }

    return jobLog;
  }

  findById(id: string): Promise<JobLogDocument | null> {
    return this.repository.findById(id);
  }

  updateStatus(
    id: string,
    status: Parameters<JobLogRepository['updateStatus']>[1],
    extra?: Parameters<JobLogRepository['updateStatus']>[2],
  ): Promise<void> {
    return this.repository.updateStatus(id, status, extra);
  }

  list(
    filters: JobLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: JobLogDocument[]; total: number }> {
    return this.repository.list(filters, page, limit);
  }
}
