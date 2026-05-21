import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin/admin-auth.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminSystemModule } from './admin/system/admin-system.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { ProfileModule } from './profiles/profile.module';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    RbacModule,
    ProfileModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminSystemModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
