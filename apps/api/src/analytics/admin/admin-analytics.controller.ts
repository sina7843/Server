import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { AdminAnalyticsService } from './admin-analytics.service';
import { parseAdminAnalyticsQuery } from './dto/admin-analytics-query';

@Controller('admin/v1/analytics')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAnalyticsController {
  constructor(private readonly service: AdminAnalyticsService) {}

  @Get('summary')
  @RequirePermission(Permissions.ANALYTICS_READ)
  getSummary(@Query() query: unknown): Promise<AnalyticsSummaryDto> {
    return this.service.getSummary(parseAdminAnalyticsQuery(query));
  }

  @Get('content/top')
  @RequirePermission(Permissions.ANALYTICS_READ)
  getContentTop(@Query() query: unknown): Promise<AnalyticsContentSummaryDto> {
    return this.service.getContentTop(parseAdminAnalyticsQuery(query));
  }

  @Get('auth')
  @RequirePermission(Permissions.ANALYTICS_READ)
  getAuth(@Query() query: unknown): Promise<AnalyticsAuthSummaryDto> {
    return this.service.getAuth(parseAdminAnalyticsQuery(query));
  }

  @Get('otp')
  @RequirePermission(Permissions.ANALYTICS_READ)
  getOtp(@Query() query: unknown): Promise<AnalyticsOtpSummaryDto> {
    return this.service.getOtp(parseAdminAnalyticsQuery(query));
  }

  @Get('media')
  @RequirePermission(Permissions.ANALYTICS_READ)
  getMedia(@Query() query: unknown): Promise<AnalyticsMediaSummaryDto> {
    return this.service.getMedia(parseAdminAnalyticsQuery(query));
  }
}
