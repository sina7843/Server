import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model, Types } from 'mongoose';
import { AnalyticsEvent, type AnalyticsEventDocument } from './analytics-event.schema';
import type { AnalyticsDateFilter } from './analytics.types';
import type { AnalyticsEventType } from '@dragon/types';

export interface WriteAnalyticsEventInput {
  readonly type: AnalyticsEventType;
  readonly userId?: string;
  readonly anonymousId?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ipHash?: string;
  readonly userAgent?: string;
}

export interface ContentViewCount {
  readonly resourceId: string;
  readonly views: number;
}

@Injectable()
export class AnalyticsEventRepository {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly model: Model<AnalyticsEventDocument>,
  ) {}

  async create(input: WriteAnalyticsEventInput): Promise<void> {
    const doc: Record<string, unknown> = { type: input.type };
    if (input.userId !== undefined) doc.userId = new Types.ObjectId(input.userId);
    if (input.anonymousId !== undefined) doc.anonymousId = input.anonymousId;
    if (input.resourceType !== undefined) doc.resourceType = input.resourceType;
    if (input.resourceId !== undefined) doc.resourceId = input.resourceId;
    if (input.metadata !== undefined) doc.metadata = input.metadata;
    if (input.ipHash !== undefined) doc.ipHash = input.ipHash;
    if (input.userAgent !== undefined) doc.userAgent = input.userAgent;
    await this.model.create(doc);
  }

  countByType(type: AnalyticsEventType, filter?: AnalyticsDateFilter): Promise<number> {
    return this.model.countDocuments(this.buildQuery({ type }, filter)).exec();
  }

  async countByTypes(
    types: readonly AnalyticsEventType[],
    filter?: AnalyticsDateFilter,
  ): Promise<Map<AnalyticsEventType, number>> {
    const query = this.buildQuery({}, filter);
    const results = await this.model
      .aggregate<{
        _id: AnalyticsEventType;
        count: number;
      }>([
        { $match: { ...query, type: { $in: types } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ])
      .exec();

    const map = new Map<AnalyticsEventType, number>();
    for (const r of results) {
      map.set(r._id, r.count);
    }
    return map;
  }

  async getTopContentByViews(
    limit: number,
    filter?: AnalyticsDateFilter,
  ): Promise<ContentViewCount[]> {
    const query = this.buildQuery(
      { type: 'content.viewed', resourceId: { $exists: true } },
      filter,
    );
    const results = await this.model
      .aggregate<{
        _id: string;
        views: number;
      }>([
        { $match: query },
        { $group: { _id: '$resourceId', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: limit },
      ])
      .exec();

    return results.map((r) => ({ resourceId: r._id, views: r.views }));
  }

  private buildQuery(
    base: FilterQuery<AnalyticsEvent>,
    filter?: AnalyticsDateFilter,
  ): FilterQuery<AnalyticsEvent> {
    const query: FilterQuery<AnalyticsEvent> = { ...base };
    if (filter?.dateFrom !== undefined || filter?.dateTo !== undefined) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};
      if (filter?.dateFrom !== undefined) dateRange.$gte = filter.dateFrom;
      if (filter?.dateTo !== undefined) dateRange.$lte = filter.dateTo;
      query.createdAt = dateRange;
    }
    return query;
  }
}
