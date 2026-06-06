import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import {
  TournamentRegistration,
  TournamentRegistrationSchema,
} from './tournament-registration.schema';
import { TournamentRegistrationRepository } from './tournament-registration.repository';
import { TournamentRegistrationService } from './tournament-registration.service';
import { PublicTournamentRegistrationsController } from './public-tournament-registrations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TournamentRegistration.name,
        schema: TournamentRegistrationSchema,
      },
    ]),
    AuditModule,
    AuthModule,
    AnalyticsModule,
    NotificationsModule,
    TournamentsModule,
  ],
  providers: [TournamentRegistrationRepository, TournamentRegistrationService],
  controllers: [PublicTournamentRegistrationsController],
  exports: [TournamentRegistrationService],
})
export class TournamentRegistrationsModule {}
