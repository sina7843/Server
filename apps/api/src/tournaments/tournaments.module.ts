import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesModule } from '../games/games.module';
import { Tournament, TournamentSchema } from './tournament.schema';
import { TournamentRepository } from './tournament.repository';
import { TournamentService } from './tournament.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tournament.name, schema: TournamentSchema }]),
    GamesModule,
  ],
  providers: [TournamentRepository, TournamentService],
  exports: [TournamentRepository, TournamentService],
})
export class TournamentsModule {}
