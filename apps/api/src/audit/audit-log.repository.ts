import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model, Types } from 'mongoose';
import { AuditLog, type AuditLogDocument } from './audit-log.schema';
import type { AuditLogFilters, AuditLogId, WriteAuditLogInput } from './audit-log.types';

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

  async list(
    filters: AuditLogFilters,
    page: number,
    limit: number,
  ): Promise<{ items: AuditLogDocument[]; total: number }> {
    const query: FilterQuery<AuditLog> = {};

    if (filters.actorId !== undefined) query.actorId = new Types.ObjectId(filters.actorId);
    if (filters.actorType !== undefined) query.actorType = filters.actorType;
    if (filters.action !== undefined) query.action = filters.action;
    if (filters.resourceType !== undefined) query.resourceType = filters.resourceType;
    if (filters.resourceId !== undefined) query.resourceId = filters.resourceId;
    if (filters.severity !== undefined) query.severity = filters.severity;
    if (filters.requestId !== undefined) query.requestId = filters.requestId;
    if (filters.correlationId !== undefined) query.correlationId = filters.correlationId;

    if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};
      if (filters.dateFrom !== undefined) dateRange.$gte = filters.dateFrom;
      if (filters.dateTo !== undefined) dateRange.$lte = filters.dateTo;
      query.createdAt = dateRange;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.auditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }
}
