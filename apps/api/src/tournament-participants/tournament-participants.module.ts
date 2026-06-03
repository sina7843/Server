import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import {
  TournamentRegistration,
  TournamentRegistrationSchema,
} from '../tournament-registrations/tournament-registration.schema';
import { TournamentParticipantService } from './tournament-participant.service';
import { PublicTournamentParticipantsController } from './public-tournament-participants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TournamentRegistration.name,
        schema: TournamentRegistrationSchema,
      },
    ]),
    AuditModule,
    TournamentsModule,
  ],
  providers: [TournamentParticipantService],
  controllers: [PublicTournamentParticipantsController],
  exports: [TournamentParticipantService],
})
export class TournamentParticipantsModule {}
