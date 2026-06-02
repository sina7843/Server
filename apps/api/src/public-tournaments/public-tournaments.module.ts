import { Module } from '@nestjs/common';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { PublicTournamentsController } from './public-tournaments.controller';

@Module({
  imports: [TournamentsModule],
  controllers: [PublicTournamentsController],
})
export class PublicTournamentsModule {}
