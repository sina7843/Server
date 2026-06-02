import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentMatchesModule } from '../../tournament-matches/tournament-matches.module';
import { AdminTournamentResultsController } from './admin-tournament-results.controller';

@Module({
  imports: [AuthModule, RbacModule, TournamentsModule, TournamentMatchesModule],
  controllers: [AdminTournamentResultsController],
})
export class AdminTournamentResultsModule {}
