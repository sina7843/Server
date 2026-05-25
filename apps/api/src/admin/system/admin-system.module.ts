import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { HealthModule } from '../../health/health.module';
import { AdminSystemController } from './admin-system.controller';

@Module({
  imports: [AuthModule, RbacModule, HealthModule],
  controllers: [AdminSystemController],
})
export class AdminSystemModule {}
