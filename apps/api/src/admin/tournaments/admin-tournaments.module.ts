import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentRegistrationsModule } from '../../tournament-registrations/tournament-registrations.module';
import { AdminTournamentsController } from './admin-tournaments.controller';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    NotificationsModule,
    RbacModule,
    TournamentsModule,
    TournamentRegistrationsModule,
  ],
  controllers: [AdminTournamentsController],
})
export class AdminTournamentsModule {}
