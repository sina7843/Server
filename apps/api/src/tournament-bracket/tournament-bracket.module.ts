import { Module } from '@nestjs/common';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentMatchesModule } from '../tournament-matches/tournament-matches.module';
import { TournamentParticipantsModule } from '../tournament-participants/tournament-participants.module';
import { TournamentBracketService } from './tournament-bracket.service';
import { PublicTournamentBracketController } from './public-tournament-bracket.controller';

@Module({
  imports: [TournamentsModule, TournamentMatchesModule, TournamentParticipantsModule],
  providers: [TournamentBracketService],
  controllers: [PublicTournamentBracketController],
  exports: [TournamentBracketService],
})
export class TournamentBracketModule {}
