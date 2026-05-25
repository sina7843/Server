import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsContentTopItemDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';
import type { ContentViewCount } from '../../analytics-event.repository';

export function toAnalyticsSummaryDto(
  counts: {
    registrations: number;
    logins: number;
    otpRequested: number;
    contentViews: number;
    contentPublished: number;
    mediaUploads: number;
  },
  dateFrom?: string,
  dateTo?: string,
): AnalyticsSummaryDto {
  return {
    registrations: counts.registrations,
    logins: counts.logins,
    otpRequested: counts.otpRequested,
    contentViews: counts.contentViews,
    contentPublished: counts.contentPublished,
    mediaUploads: counts.mediaUploads,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
}

export function toAnalyticsAuthSummaryDto(
  registrations: number,
  logins: number,
  dateFrom?: string,
  dateTo?: string,
): AnalyticsAuthSummaryDto {
  return {
    registrations,
    logins,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
}

export function toAnalyticsOtpSummaryDto(
  requested: number,
  verified: number,
  failed: number,
  dateFrom?: string,
  dateTo?: string,
): AnalyticsOtpSummaryDto {
  return {
    requested,
    verified,
    failed,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
}

export function toAnalyticsContentSummaryDto(
  views: number,
  published: number,
  top: readonly ContentViewCount[],
  dateFrom?: string,
  dateTo?: string,
): AnalyticsContentSummaryDto {
  const topItems: AnalyticsContentTopItemDto[] = top.map((t) => ({
    resourceId: t.resourceId,
    views: t.views,
  }));
  return {
    views,
    published,
    top: topItems,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
}

export function toAnalyticsMediaSummaryDto(
  uploads: number,
  dateFrom?: string,
  dateTo?: string,
): AnalyticsMediaSummaryDto {
  return {
    uploads,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };
}
