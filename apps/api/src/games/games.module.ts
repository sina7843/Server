import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './game.schema';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { PublicGamesController } from './public/public-games.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }])],
  controllers: [PublicGamesController],
  providers: [GameRepository, GameService],
  exports: [GameService],
})
export class GamesModule {}
