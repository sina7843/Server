import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model } from 'mongoose';
import type { NotificationChannel, NotificationStatus } from '@dragon/types';
import {
  NotificationLog,
  type NotificationLogDocument,
} from '../auth/notifications/notification-log.schema';
import { maskPhone } from '../auth/security/masking';
import { hashToken } from '../auth/security/token-hasher';
import { NotificationTemplateRepository } from './notification-template.repository';
import type { NotificationTemplateDocument } from './notification-template.schema';

export interface CreateQueuedLogInput {
  channel: NotificationChannel;
  provider: string;
  recipientMasked: string;
  recipientHash: string;
  templateKey?: string;
  purpose?: string;
  requestId?: string;
  correlationId?: string;
}

export interface CreateQueuedSmsLogInput {
  provider: string;
  recipientPhoneNormalized: string;
  templateKey?: string;
  purpose?: string;
  requestId?: string;
  correlationId?: string;
}

export interface NotificationLogListFilters {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  provider?: string;
  templateKey?: string;
  purpose?: string;
  recipientHash?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
    private readonly templateRepository: NotificationTemplateRepository,
  ) {}

  async createQueuedLog(input: CreateQueuedLogInput): Promise<NotificationLogDocument> {
    const doc: Record<string, unknown> = {
      channel: input.channel,
      provider: input.provider,
      recipientMasked: input.recipientMasked,
      recipientHash: input.recipientHash,
      status: 'queued' as NotificationStatus,
    };
    if (input.templateKey !== undefined) doc.templateKey = input.templateKey;
    if (input.purpose !== undefined) doc.purpose = input.purpose;
    if (input.requestId !== undefined) doc.requestId = input.requestId;
    if (input.correlationId !== undefined) doc.correlationId = input.correlationId;
    return this.notificationLogModel.create(doc);
  }

  async createQueuedSmsLog(input: CreateQueuedSmsLogInput): Promise<NotificationLogDocument> {
    return this.createQueuedLog({
      channel: 'sms',
      provider: input.provider,
      recipientMasked: maskPhone(input.recipientPhoneNormalized),
      recipientHash: hashToken(input.recipientPhoneNormalized),
      ...(input.templateKey !== undefined ? { templateKey: input.templateKey } : {}),
      ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }

  async markSent(id: string, providerMessageId?: string): Promise<void> {
    const set: Record<string, unknown> = { status: 'sent' as NotificationStatus };
    if (providerMessageId !== undefined) set.providerMessageId = providerMessageId;
    await this.notificationLogModel.findByIdAndUpdate(id, { $set: set }).exec();
  }

  async markFailed(id: string, errorCode?: string, errorMessage?: string): Promise<void> {
    const set: Record<string, unknown> = { status: 'failed' as NotificationStatus };
    if (errorCode !== undefined) set.errorCode = errorCode;
    if (errorMessage !== undefined) set.errorMessage = sanitizeErrorMessage(errorMessage);
    await this.notificationLogModel.findByIdAndUpdate(id, { $set: set }).exec();
  }

  async markSkipped(id: string): Promise<void> {
    await this.notificationLogModel
      .findByIdAndUpdate(id, { $set: { status: 'skipped' as NotificationStatus } })
      .exec();
  }

  getLog(id: string): Promise<NotificationLogDocument | null> {
    return this.notificationLogModel.findById(id).exec();
  }

  async listLogs(
    filters: NotificationLogListFilters,
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

  findTemplate(
    key: string,
    channel: string,
    locale: string,
  ): Promise<NotificationTemplateDocument | null> {
    return this.templateRepository.findTemplate(key, channel, locale);
  }

  renderTemplate(body: string, variables: Record<string, string>): string {
    return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
  }
}

function sanitizeErrorMessage(message: string): string {
  const sensitivePatterns = [/password/i, /token/i, /secret/i, /credential/i, /key/i, /otp/i];
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'Provider error occurred.';
    }
  }
  return message.slice(0, 500);
}
