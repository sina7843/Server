import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin/admin-auth.module';
import { AdminContentModule } from './admin/content/admin-content.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminSystemModule } from './admin/system/admin-system.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profiles/profile.module';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    RbacModule,
    ProfileModule,
    ContentModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminSystemModule,
    AdminContentModule,
    MediaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
