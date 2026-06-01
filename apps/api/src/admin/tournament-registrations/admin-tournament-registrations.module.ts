import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentRegistrationsModule } from '../../tournament-registrations/tournament-registrations.module';
import { AdminTournamentRegistrationsController } from './admin-tournament-registrations.controller';

@Module({
  imports: [AuthModule, RbacModule, TournamentsModule, TournamentRegistrationsModule],
  controllers: [AdminTournamentRegistrationsController],
})
export class AdminTournamentRegistrationsModule {}
