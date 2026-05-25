import type { ApiClient } from './client';
import type { AdminAnalyticsClient, AnalyticsDateRangeParams } from './admin-analytics-types';
import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';

function buildDateRangeQs(params?: AnalyticsDateRangeParams): string {
  const search = new URLSearchParams();
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  return search.toString();
}

export function createAdminAnalyticsClient(client: ApiClient): AdminAnalyticsClient {
  return {
    getSummary(params?: AnalyticsDateRangeParams): Promise<AnalyticsSummaryDto> {
      const qs = buildDateRangeQs(params);
      return client.request<AnalyticsSummaryDto>({
        method: 'GET',
        path: `/admin/v1/analytics/summary${qs ? `?${qs}` : ''}`,
      });
    },

    getContentTop(params?: AnalyticsDateRangeParams): Promise<AnalyticsContentSummaryDto> {
      const qs = buildDateRangeQs(params);
      return client.request<AnalyticsContentSummaryDto>({
        method: 'GET',
        path: `/admin/v1/analytics/content/top${qs ? `?${qs}` : ''}`,
      });
    },

    getAuth(params?: AnalyticsDateRangeParams): Promise<AnalyticsAuthSummaryDto> {
      const qs = buildDateRangeQs(params);
      return client.request<AnalyticsAuthSummaryDto>({
        method: 'GET',
        path: `/admin/v1/analytics/auth${qs ? `?${qs}` : ''}`,
      });
    },

    getOtp(params?: AnalyticsDateRangeParams): Promise<AnalyticsOtpSummaryDto> {
      const qs = buildDateRangeQs(params);
      return client.request<AnalyticsOtpSummaryDto>({
        method: 'GET',
        path: `/admin/v1/analytics/otp${qs ? `?${qs}` : ''}`,
      });
    },

    getMedia(params?: AnalyticsDateRangeParams): Promise<AnalyticsMediaSummaryDto> {
      const qs = buildDateRangeQs(params);
      return client.request<AnalyticsMediaSummaryDto>({
        method: 'GET',
        path: `/admin/v1/analytics/media${qs ? `?${qs}` : ''}`,
      });
    },
  };
}
