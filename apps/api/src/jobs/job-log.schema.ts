import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const JOB_STATUSES = ['queued', 'processing', 'completed', 'failed', 'retrying'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type JobLogDocument = HydratedDocument<JobLog>;

@Schema({
  collection: 'job_logs',
  timestamps: { createdAt: true, updatedAt: true },
})
export class JobLog {
  @Prop({ required: true })
  queueName!: string;

  @Prop({ required: true })
  jobName!: string;

  @Prop()
  bullJobId?: string;

  @Prop({ required: true, enum: JOB_STATUSES, default: 'queued' })
  status!: JobStatus;

  @Prop({ required: true, default: 0 })
  attempts!: number;

  @Prop({ required: true })
  maxAttempts!: number;

  @Prop({ type: Object })
  payloadSummary?: Record<string, unknown>;

  @Prop()
  error?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const JobLogSchema = SchemaFactory.createForClass(JobLog);

JobLogSchema.index({ queueName: 1, createdAt: -1 });
JobLogSchema.index({ jobName: 1, createdAt: -1 });
JobLogSchema.index({ status: 1, createdAt: -1 });
JobLogSchema.index({ bullJobId: 1 }, { sparse: true });
JobLogSchema.index({ createdAt: -1 });
