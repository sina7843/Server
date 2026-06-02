import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentParticipantsModule } from '../../tournament-participants/tournament-participants.module';
import { TournamentStandingsModule } from '../../tournament-standings/tournament-standings.module';
import { AdminTournamentStandingsController } from './admin-tournament-standings.controller';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    TournamentsModule,
    TournamentParticipantsModule,
    TournamentStandingsModule,
  ],
  controllers: [AdminTournamentStandingsController],
})
export class AdminTournamentStandingsModule {}
