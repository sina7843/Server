import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model } from 'mongoose';
import { JobLog, type JobLogDocument, type JobStatus } from './job-log.schema';

export interface JobLogFilters {
  queueName?: string;
  jobName?: string;
  status?: JobStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateJobLogInput {
  queueName: string;
  jobName: string;
  maxAttempts: number;
  payloadSummary?: Record<string, unknown>;
  bullJobId?: string;
}

export interface UpdateJobLogStatusInput {
  attempts?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  bullJobId?: string;
}

@Injectable()
export class JobLogRepository {
  constructor(@InjectModel(JobLog.name) private readonly model: Model<JobLogDocument>) {}

  async create(input: CreateJobLogInput): Promise<JobLogDocument> {
    const doc: Record<string, unknown> = {
      queueName: input.queueName,
      jobName: input.jobName,
      maxAttempts: input.maxAttempts,
      status: 'queued',
      attempts: 0,
    };
    if (input.bullJobId !== undefined) doc.bullJobId = input.bullJobId;
    if (input.payloadSummary !== undefined) doc.payloadSummary = input.payloadSummary;
    return this.model.create(doc);
  }

  findById(id: string): Promise<JobLogDocument | null> {
    return this.model.findById(id).exec();
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    extra: UpdateJobLogStatusInput = {},
  ): Promise<void> {
    const update: Record<string, unknown> = { status };
    if (extra.attempts !== undefined) update.attempts = extra.attempts;
    if (extra.error !== undefined) update.error = extra.error;
    if (extra.startedAt !== undefined) update.startedAt = extra.startedAt;
    if (extra.completedAt !== undefined) update.completedAt = extra.completedAt;
    if (extra.bullJobId !== undefined) update.bullJobId = extra.bullJobId;
    await this.model.findByIdAndUpdate(id, { $set: update }).exec();
  }

  async list(
    filters: JobLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: JobLogDocument[]; total: number }> {
    const query: FilterQuery<JobLog> = {};
    if (filters.queueName !== undefined) query.queueName = filters.queueName;
    if (filters.jobName !== undefined) query.jobName = filters.jobName;
    if (filters.status !== undefined) query.status = filters.status;
    if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};
      if (filters.dateFrom !== undefined) dateRange.$gte = filters.dateFrom;
      if (filters.dateTo !== undefined) dateRange.$lte = filters.dateTo;
      query.createdAt = dateRange;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }
}
