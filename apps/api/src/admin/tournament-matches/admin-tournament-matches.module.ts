import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentParticipantsModule } from '../../tournament-participants/tournament-participants.module';
import { TournamentMatchesModule } from '../../tournament-matches/tournament-matches.module';
import { AdminTournamentMatchesController } from './admin-tournament-matches.controller';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    TournamentsModule,
    TournamentParticipantsModule,
    TournamentMatchesModule,
  ],
  controllers: [AdminTournamentMatchesController],
})
export class AdminTournamentMatchesModule {}
