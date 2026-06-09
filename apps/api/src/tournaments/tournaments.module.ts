import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesModule } from '../games/games.module';
import { MediaModule } from '../media/media.module';
import { Tournament, TournamentSchema } from './tournament.schema';
import { TournamentRepository } from './tournament.repository';
import { TournamentService } from './tournament.service';
import { TournamentEnrichmentService } from './tournament-enrichment.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tournament.name, schema: TournamentSchema }]),
    GamesModule,
    MediaModule,
  ],
  providers: [TournamentRepository, TournamentService, TournamentEnrichmentService],
  exports: [TournamentRepository, TournamentService, TournamentEnrichmentService],
})
export class TournamentsModule {}
