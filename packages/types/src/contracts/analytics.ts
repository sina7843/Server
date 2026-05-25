export interface AnalyticsDateRangeQueryDto {
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AnalyticsSummaryDto {
  readonly registrations: number;
  readonly logins: number;
  readonly otpRequested: number;
  readonly contentViews: number;
  readonly contentPublished: number;
  readonly mediaUploads: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AnalyticsAuthSummaryDto {
  readonly registrations: number;
  readonly logins: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AnalyticsOtpSummaryDto {
  readonly requested: number;
  readonly verified: number;
  readonly failed: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AnalyticsContentTopItemDto {
  readonly resourceId: string;
  readonly views: number;
  readonly type?: string;
  readonly title?: string;
}

export interface AnalyticsContentSummaryDto {
  readonly views: number;
  readonly published: number;
  readonly top: readonly AnalyticsContentTopItemDto[];
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface AnalyticsMediaSummaryDto {
  readonly uploads: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}
