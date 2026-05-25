import { Injectable } from '@nestjs/common';
import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';
import { AnalyticsEventRepository } from '../analytics-event.repository';
import type { AdminAnalyticsQueryDto } from './dto/admin-analytics-query';
import {
  toAnalyticsAuthSummaryDto,
  toAnalyticsContentSummaryDto,
  toAnalyticsMediaSummaryDto,
  toAnalyticsOtpSummaryDto,
  toAnalyticsSummaryDto,
} from './dto/admin-analytics-response';

const TOP_CONTENT_LIMIT = 10;

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly repository: AnalyticsEventRepository) {}

  async getSummary(query: AdminAnalyticsQueryDto): Promise<AnalyticsSummaryDto> {
    const counts = await this.repository.countByTypes(
      [
        'user.registered',
        'user.logged_in',
        'otp.requested',
        'content.viewed',
        'content.published',
        'media.uploaded',
      ],
      query.filter,
    );

    return toAnalyticsSummaryDto(
      {
        registrations: counts.get('user.registered') ?? 0,
        logins: counts.get('user.logged_in') ?? 0,
        otpRequested: counts.get('otp.requested') ?? 0,
        contentViews: counts.get('content.viewed') ?? 0,
        contentPublished: counts.get('content.published') ?? 0,
        mediaUploads: counts.get('media.uploaded') ?? 0,
      },
      query.dateFrom,
      query.dateTo,
    );
  }

  async getAuth(query: AdminAnalyticsQueryDto): Promise<AnalyticsAuthSummaryDto> {
    const counts = await this.repository.countByTypes(
      ['user.registered', 'user.logged_in'],
      query.filter,
    );
    return toAnalyticsAuthSummaryDto(
      counts.get('user.registered') ?? 0,
      counts.get('user.logged_in') ?? 0,
      query.dateFrom,
      query.dateTo,
    );
  }

  async getOtp(query: AdminAnalyticsQueryDto): Promise<AnalyticsOtpSummaryDto> {
    const counts = await this.repository.countByTypes(
      ['otp.requested', 'otp.verified', 'otp.failed'],
      query.filter,
    );
    return toAnalyticsOtpSummaryDto(
      counts.get('otp.requested') ?? 0,
      counts.get('otp.verified') ?? 0,
      counts.get('otp.failed') ?? 0,
      query.dateFrom,
      query.dateTo,
    );
  }

  async getContentTop(query: AdminAnalyticsQueryDto): Promise<AnalyticsContentSummaryDto> {
    const limit = Math.min(query.limit, TOP_CONTENT_LIMIT);
    const [views, published, top] = await Promise.all([
      this.repository.countByType('content.viewed', query.filter),
      this.repository.countByType('content.published', query.filter),
      this.repository.getTopContentByViews(limit, query.filter),
    ]);
    return toAnalyticsContentSummaryDto(views, published, top, query.dateFrom, query.dateTo);
  }

  async getMedia(query: AdminAnalyticsQueryDto): Promise<AnalyticsMediaSummaryDto> {
    const uploads = await this.repository.countByType('media.uploaded', query.filter);
    return toAnalyticsMediaSummaryDto(uploads, query.dateFrom, query.dateTo);
  }
}
