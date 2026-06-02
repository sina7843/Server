import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentMatch, TournamentMatchSchema } from './tournament-match.schema';
import { TournamentMatchRepository } from './tournament-match.repository';
import { TournamentMatchService } from './tournament-match.service';
import { TournamentResultService } from './tournament-result.service';
import { PublicTournamentMatchesController } from './public-tournament-matches.controller';
import { PublicTournamentResultsController } from './public-tournament-results.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TournamentMatch.name, schema: TournamentMatchSchema }]),
    AuditModule,
    AuthModule,
    TournamentsModule,
  ],
  providers: [TournamentMatchRepository, TournamentMatchService, TournamentResultService],
  controllers: [PublicTournamentMatchesController, PublicTournamentResultsController],
  exports: [TournamentMatchService, TournamentResultService, TournamentMatchRepository],
})
export class TournamentMatchesModule {}
