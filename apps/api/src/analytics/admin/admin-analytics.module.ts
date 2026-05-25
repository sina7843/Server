import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { AnalyticsModule } from '../analytics.module';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';

@Module({
  imports: [AnalyticsModule, AuthModule, RbacModule],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
