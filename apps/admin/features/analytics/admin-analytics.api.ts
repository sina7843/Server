import { createAdminAnalyticsClient } from '@dragon/sdk';
import type { ApiClient, AnalyticsDateRangeParams } from '@dragon/sdk';
import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';

export async function getAnalyticsSummary(
  client: ApiClient,
  params?: AnalyticsDateRangeParams,
): Promise<AnalyticsSummaryDto> {
  return createAdminAnalyticsClient(client).getSummary(params);
}

export async function getAnalyticsAuth(
  client: ApiClient,
  params?: AnalyticsDateRangeParams,
): Promise<AnalyticsAuthSummaryDto> {
  return createAdminAnalyticsClient(client).getAuth(params);
}

export async function getAnalyticsOtp(
  client: ApiClient,
  params?: AnalyticsDateRangeParams,
): Promise<AnalyticsOtpSummaryDto> {
  return createAdminAnalyticsClient(client).getOtp(params);
}

export async function getAnalyticsContentTop(
  client: ApiClient,
  params?: AnalyticsDateRangeParams,
): Promise<AnalyticsContentSummaryDto> {
  return createAdminAnalyticsClient(client).getContentTop(params);
}

export async function getAnalyticsMedia(
  client: ApiClient,
  params?: AnalyticsDateRangeParams,
): Promise<AnalyticsMediaSummaryDto> {
  return createAdminAnalyticsClient(client).getMedia(params);
}
