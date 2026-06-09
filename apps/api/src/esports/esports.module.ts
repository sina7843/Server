import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { MediaModule } from '../media/media.module';
import { EsportsService } from './esports.service';
import { EsportsController } from './esports.controller';
import { EsportsSeedService } from './seeds/esports-seed.service';

@Module({
  imports: [ContentModule, TournamentsModule, MediaModule],
  controllers: [EsportsController],
  providers: [EsportsService, EsportsSeedService],
  exports: [EsportsSeedService],
})
export class EsportsModule {}
