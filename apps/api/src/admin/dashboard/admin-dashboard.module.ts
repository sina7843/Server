import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
