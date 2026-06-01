import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { TournamentParticipantsModule } from '../../tournament-participants/tournament-participants.module';
import { AdminTournamentParticipantsController } from './admin-tournament-participants.controller';

@Module({
  imports: [AuthModule, RbacModule, TournamentsModule, TournamentParticipantsModule],
  controllers: [AdminTournamentParticipantsController],
})
export class AdminTournamentParticipantsModule {}
