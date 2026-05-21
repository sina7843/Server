import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { AdminAuthController } from './admin-auth.controller';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [AdminAuthController],
})
export class AdminAuthModule {}
