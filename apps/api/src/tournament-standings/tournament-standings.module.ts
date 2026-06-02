import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentMatchesModule } from '../tournament-matches/tournament-matches.module';
import { TournamentParticipantsModule } from '../tournament-participants/tournament-participants.module';
import { TournamentStandingsService } from './tournament-standings.service';
import { PublicTournamentStandingsController } from './public-tournament-standings.controller';

@Module({
  imports: [AuditModule, TournamentsModule, TournamentMatchesModule, TournamentParticipantsModule],
  providers: [TournamentStandingsService],
  controllers: [PublicTournamentStandingsController],
  exports: [TournamentStandingsService],
})
export class TournamentStandingsModule {}
