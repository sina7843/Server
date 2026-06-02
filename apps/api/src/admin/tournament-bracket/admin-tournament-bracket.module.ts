import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentParticipantsModule } from '../../tournament-participants/tournament-participants.module';
import { TournamentBracketModule } from '../../tournament-bracket/tournament-bracket.module';
import { AdminTournamentBracketController } from './admin-tournament-bracket.controller';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    TournamentsModule,
    TournamentParticipantsModule,
    TournamentBracketModule,
  ],
  controllers: [AdminTournamentBracketController],
})
export class AdminTournamentBracketModule {}
