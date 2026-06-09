import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaModule } from '../media/media.module';
import { Game, GameSchema } from './game.schema';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { GameEnrichmentService } from './game-enrichment.service';
import { PublicGamesController } from './public/public-games.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]), MediaModule],
  controllers: [PublicGamesController],
  providers: [GameRepository, GameService, GameEnrichmentService],
  exports: [GameRepository, GameService, GameEnrichmentService],
})
export class GamesModule {}
