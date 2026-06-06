import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { PublicTournamentsController } from './public-tournaments.controller';

@Module({
  imports: [AnalyticsModule, TournamentsModule],
  controllers: [PublicTournamentsController],
})
export class PublicTournamentsModule {}
