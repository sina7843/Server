import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_SEVERITIES,
  type AuditActorType,
  type AuditSeverity,
} from '@dragon/types';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AuditLog {
  @Prop({ type: Types.ObjectId })
  actorId?: Types.ObjectId;

  @Prop({ required: true, enum: AUDIT_ACTOR_TYPES })
  actorType!: AuditActorType;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  resourceType!: string;

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  before?: Record<string, unknown>;

  @Prop({ type: Object })
  after?: Record<string, unknown>;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  requestId?: string;

  @Prop()
  correlationId?: string;

  @Prop({ required: true, enum: AUDIT_SEVERITIES, default: 'info' })
  severity!: AuditSeverity;

  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ requestId: 1 }, { sparse: true });
AuditLogSchema.index({ createdAt: -1 });
