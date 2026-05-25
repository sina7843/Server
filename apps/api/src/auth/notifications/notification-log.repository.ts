import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model } from 'mongoose';
import { NotificationLog, type NotificationLogDocument } from './notification-log.schema';
import type {
  CreateNotificationLogInput,
  NotificationChannel,
  NotificationStatus,
} from './notification-log.types';
import { sanitizeNotificationErrorMessage } from './notification-error-sanitizer';

export interface NotificationLogFilters {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  provider?: string;
  templateKey?: string;
  purpose?: string;
  recipientHash?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UpdateNotificationLogInput {
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class NotificationLogRepository {
  constructor(
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
  ) {}

  async createLog(input: CreateNotificationLogInput): Promise<NotificationLogDocument> {
    const created = await this.notificationLogModel.create({
      channel: input.channel,
      provider: input.provider,
      recipientMasked: input.recipientMasked,
      recipientHash: input.recipientHash,
      templateKey: input.templateKey,
      purpose: input.purpose,
      status: input.status,
      providerMessageId: input.providerMessageId,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      requestId: input.requestId,
      correlationId: input.correlationId,
    });

    return created as NotificationLogDocument;
  }

  findByProviderMessageId(providerMessageId: string): Promise<NotificationLogDocument | null> {
    return this.notificationLogModel.findOne({ providerMessageId }).exec();
  }

  findById(id: string): Promise<NotificationLogDocument | null> {
    return this.notificationLogModel.findById(id).exec();
  }

  findRecentByRecipientHash(
    recipientHash: string,
    since: Date,
  ): Promise<NotificationLogDocument[]> {
    return this.notificationLogModel
      .find({
        recipientHash,
        createdAt: { $gte: since },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    updates: UpdateNotificationLogInput = {},
  ): Promise<void> {
    const set: Record<string, unknown> = { status };
    if (updates.providerMessageId !== undefined) set.providerMessageId = updates.providerMessageId;
    if (updates.errorCode !== undefined) set.errorCode = updates.errorCode;
    if (updates.errorMessage !== undefined)
      set.errorMessage = sanitizeNotificationErrorMessage(updates.errorMessage);
    await this.notificationLogModel.findByIdAndUpdate(id, { $set: set }).exec();
  }

  async list(
    filters: NotificationLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: NotificationLogDocument[]; total: number }> {
    const query: FilterQuery<NotificationLog> = {};
    if (filters.channel !== undefined) query.channel = filters.channel;
    if (filters.status !== undefined) query.status = filters.status;
    if (filters.provider !== undefined) query.provider = filters.provider;
    if (filters.templateKey !== undefined) query.templateKey = filters.templateKey;
    if (filters.purpose !== undefined) query.purpose = filters.purpose;
    if (filters.recipientHash !== undefined) query.recipientHash = filters.recipientHash;
    if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};
      if (filters.dateFrom !== undefined) dateRange.$gte = filters.dateFrom;
      if (filters.dateTo !== undefined) dateRange.$lte = filters.dateTo;
      query.createdAt = dateRange;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.notificationLogModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }
}
