import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import {
  TournamentRegistration,
  TournamentRegistrationSchema,
} from '../tournament-registrations/tournament-registration.schema';
import { TournamentParticipantService } from './tournament-participant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TournamentRegistration.name,
        schema: TournamentRegistrationSchema,
      },
    ]),
    AuditModule,
  ],
  providers: [TournamentParticipantService],
  exports: [TournamentParticipantService],
})
export class TournamentParticipantsModule {}
