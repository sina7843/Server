import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';

export interface AnalyticsDateRangeParams {
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AdminAnalyticsClient {
  getSummary(params?: AnalyticsDateRangeParams): Promise<AnalyticsSummaryDto>;
  getContentTop(params?: AnalyticsDateRangeParams): Promise<AnalyticsContentSummaryDto>;
  getAuth(params?: AnalyticsDateRangeParams): Promise<AnalyticsAuthSummaryDto>;
  getOtp(params?: AnalyticsDateRangeParams): Promise<AnalyticsOtpSummaryDto>;
  getMedia(params?: AnalyticsDateRangeParams): Promise<AnalyticsMediaSummaryDto>;
}
