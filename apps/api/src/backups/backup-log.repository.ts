import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model } from 'mongoose';
import type { BackupStatus, BackupType } from '@dragon/types';
import { BackupLog, type BackupLogDocument } from './backup-log.schema';

export interface CreateBackupLogInput {
  readonly type: BackupType;
  readonly triggeredBy: BackupLog['triggeredBy'];
  readonly actorId?: string;
}

export interface BackupLogFilters {
  readonly type?: BackupType;
  readonly status?: BackupStatus;
}

export interface MarkCompletedInput {
  readonly completedAt: Date;
  readonly fileKey?: string;
  readonly bucket?: string;
  readonly sizeBytes?: number;
}

@Injectable()
export class BackupLogRepository {
  constructor(@InjectModel(BackupLog.name) private readonly model: Model<BackupLogDocument>) {}

  async create(input: CreateBackupLogInput): Promise<BackupLogDocument> {
    const doc: Record<string, unknown> = {
      type: input.type,
      status: 'started',
      triggeredBy: input.triggeredBy,
      startedAt: new Date(),
    };
    if (input.actorId !== undefined) doc.actorId = input.actorId;
    return this.model.create(doc);
  }

  findById(id: string): Promise<BackupLogDocument | null> {
    return this.model.findById(id).exec();
  }

  async markCompleted(id: string, meta: MarkCompletedInput): Promise<void> {
    const update: Record<string, unknown> = {
      status: 'completed',
      completedAt: meta.completedAt,
    };
    if (meta.fileKey !== undefined) update.fileKey = meta.fileKey;
    if (meta.bucket !== undefined) update.bucket = meta.bucket;
    if (meta.sizeBytes !== undefined) update.sizeBytes = meta.sizeBytes;
    await this.model.findByIdAndUpdate(id, { $set: update }).exec();
  }

  async markFailed(id: string, safeError: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, {
        $set: { status: 'failed', error: safeError, completedAt: new Date() },
      })
      .exec();
  }

  async list(
    filters: BackupLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: BackupLogDocument[]; total: number }> {
    const query: FilterQuery<BackupLog> = {};
    if (filters.type !== undefined) query.type = filters.type;
    if (filters.status !== undefined) query.status = filters.status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  findLatest(): Promise<BackupLogDocument | null> {
    return this.model.findOne({ status: 'completed' }).sort({ startedAt: -1 }).exec();
  }
}
