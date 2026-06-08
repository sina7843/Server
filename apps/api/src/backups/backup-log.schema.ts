import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type { BackupStatus, BackupTriggeredBy, BackupType } from '@dragon/types';

export type BackupLogDocument = HydratedDocument<BackupLog>;

export const BACKUP_TYPES = ['mongodb', 'media_metadata', 'manual'] as const;
export const BACKUP_STATUSES = ['started', 'completed', 'failed'] as const;
export const BACKUP_TRIGGERED_BY_VALUES = ['system', 'admin', 'manual_script'] as const;

@Schema({
  collection: 'backup_logs',
  timestamps: { createdAt: true, updatedAt: true },
})
export class BackupLog {
  @Prop({ required: true, enum: BACKUP_TYPES })
  type!: BackupType;

  @Prop({ required: true, enum: BACKUP_STATUSES, default: 'started' })
  status!: BackupStatus;

  @Prop()
  fileKey?: string;

  @Prop()
  bucket?: string;

  @Prop({ type: Number })
  sizeBytes?: number;

  @Prop({ required: true })
  startedAt!: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true, enum: BACKUP_TRIGGERED_BY_VALUES })
  triggeredBy!: BackupTriggeredBy;

  @Prop({ type: SchemaTypes.ObjectId })
  actorId?: Types.ObjectId;

  @Prop()
  error?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BackupLogSchema = SchemaFactory.createForClass(BackupLog);

BackupLogSchema.index({ status: 1, createdAt: -1 });
BackupLogSchema.index({ type: 1, createdAt: -1 });
BackupLogSchema.index({ startedAt: -1 });
BackupLogSchema.index({ triggeredBy: 1, createdAt: -1 });
