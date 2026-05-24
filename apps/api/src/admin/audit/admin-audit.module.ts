import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { RbacModule } from '../../rbac/rbac.module';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';

@Module({
  imports: [AuditModule, RbacModule],
  controllers: [AdminAuditController],
  providers: [AdminAuditService],
})
export class AdminAuditModule {}
