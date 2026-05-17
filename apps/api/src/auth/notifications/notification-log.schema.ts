import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  type NotificationChannel,
  type NotificationStatus,
} from './notification-log.types';

@Schema({ collection: 'notification_logs', timestamps: true })
export class NotificationLog {
  declare _id: Types.ObjectId;

  @Prop({ enum: NOTIFICATION_CHANNELS, required: true })
  declare channel: NotificationChannel;

  @Prop({ required: true, trim: true })
  declare provider: string;

  @Prop({ required: true, trim: true })
  declare recipientMasked: string;

  @Prop({ required: true, trim: true })
  declare recipientHash: string;

  @Prop({ trim: true })
  declare templateKey?: string;

  @Prop({ trim: true })
  declare purpose?: string;

  @Prop({ enum: NOTIFICATION_STATUSES, required: true })
  declare status: NotificationStatus;

  @Prop({ trim: true })
  declare providerMessageId?: string;

  @Prop({ trim: true })
  declare errorCode?: string;

  @Prop({ trim: true })
  declare errorMessage?: string;

  @Prop({ trim: true })
  declare requestId?: string;

  @Prop({ trim: true })
  declare correlationId?: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type NotificationLogDocument = HydratedDocument<NotificationLog>;
export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);

NotificationLogSchema.index({ recipientHash: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, createdAt: -1 });
NotificationLogSchema.index({ providerMessageId: 1 });
