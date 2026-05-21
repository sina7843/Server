import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin/admin-auth.module';
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
