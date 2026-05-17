import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog, type NotificationLogDocument } from './notification-log.schema';
import type { CreateNotificationLogInput } from './notification-log.types';

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
}
