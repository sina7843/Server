import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BackupsModule } from './backups/backup.module';
import { AdminAuditModule } from './admin/audit/admin-audit.module';
import { SearchModule } from './search/search.module';
import { AdminAnalyticsModule } from './analytics/admin/admin-analytics.module';
import { AdminNotificationsModule } from './admin/notifications/admin-notifications.module';
import { AdminAuthModule } from './admin/admin-auth.module';
import { AdminContentModule } from './admin/content/admin-content.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminJobsModule } from './admin/jobs/admin-jobs.module';
import { AdminSystemModule } from './admin/system/admin-system.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health.controller';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profiles/profile.module';
import { RbacModule } from './rbac/rbac.module';
import { EsportsModule } from './esports/esports.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventsModule,
    JobsModule,
    AuthModule,
    RbacModule,
    ProfileModule,
    ContentModule,
    EsportsModule,
    HealthModule,
    BackupsModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminSystemModule,
    AdminContentModule,
    AdminAuditModule,
    AdminJobsModule,
    AdminNotificationsModule,
    MediaModule,
    SearchModule,
    AdminAnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware, RequestIdMiddleware).forRoutes('*');
  }
}
