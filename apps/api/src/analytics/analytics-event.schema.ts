import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ANALYTICS_EVENT_TYPES, type AnalyticsEventType } from '@dragon/types';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({
  collection: 'analytics_events',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AnalyticsEvent {
  @Prop({ required: true, enum: ANALYTICS_EVENT_TYPES })
  type!: AnalyticsEventType;

  @Prop({ type: Types.ObjectId })
  userId?: Types.ObjectId;

  @Prop()
  anonymousId?: string;

  @Prop()
  resourceType?: string;

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  ipHash?: string;

  @Prop()
  userAgent?: string;

  createdAt!: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ userId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ createdAt: -1 });
