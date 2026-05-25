import type { AnalyticsEventType } from '@dragon/types';

export interface TrackInput {
  readonly type: AnalyticsEventType;
  readonly userId?: string;
  readonly anonymousId?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ip?: string;
  readonly userAgent?: string;
}

export interface AnalyticsDateFilter {
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}
