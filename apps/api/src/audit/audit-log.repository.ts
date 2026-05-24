import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, type AuditLogDocument } from './audit-log.schema';
import type { AuditLogId, WriteAuditLogInput } from './audit-log.types';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(input: WriteAuditLogInput): Promise<AuditLogDocument> {
    const doc: Record<string, unknown> = {
      actorType: input.actorType,
      action: input.action,
      resourceType: input.resourceType,
      severity: input.severity ?? 'info',
    };

    if (input.actorId !== undefined) {
      doc.actorId = new Types.ObjectId(input.actorId);
    }
    if (input.resourceId !== undefined) doc.resourceId = input.resourceId;
    if (input.before !== undefined) doc.before = input.before;
    if (input.after !== undefined) doc.after = input.after;
    if (input.metadata !== undefined) doc.metadata = input.metadata;
    if (input.ip !== undefined) doc.ip = input.ip;
    if (input.userAgent !== undefined) doc.userAgent = input.userAgent;
    if (input.requestId !== undefined) doc.requestId = input.requestId;
    if (input.correlationId !== undefined) doc.correlationId = input.correlationId;

    return this.auditLogModel.create(doc);
  }

  findById(id: AuditLogId): Promise<AuditLogDocument | null> {
    return this.auditLogModel.findById(id).exec();
  }
}
