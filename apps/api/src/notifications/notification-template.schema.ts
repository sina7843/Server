import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NOTIFICATION_CHANNELS, type NotificationChannel } from '@dragon/types';

@Schema({ collection: 'notification_templates', timestamps: true })
export class NotificationTemplate {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare key: string;

  @Prop({ required: true, enum: NOTIFICATION_CHANNELS })
  declare channel: NotificationChannel;

  @Prop({ required: true, trim: true })
  declare locale: string;

  @Prop({ required: true })
  declare body: string;

  @Prop({ type: [String], default: [] })
  declare variables: string[];

  @Prop({ default: true })
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;
export const NotificationTemplateSchema = SchemaFactory.createForClass(NotificationTemplate);

NotificationTemplateSchema.index({ key: 1, channel: 1, locale: 1 }, { unique: true });
NotificationTemplateSchema.index({ channel: 1 });
NotificationTemplateSchema.index({ isActive: 1 });
