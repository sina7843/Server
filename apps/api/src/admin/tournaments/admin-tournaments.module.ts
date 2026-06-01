import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { AdminTournamentsController } from './admin-tournaments.controller';

@Module({
  imports: [AuditModule, AuthModule, RbacModule, TournamentsModule],
  controllers: [AdminTournamentsController],
})
export class AdminTournamentsModule {}
