import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import type { BracketProjectionDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentParticipantService } from '../../tournament-participants/tournament-participant.service';
import { TournamentBracketService } from '../../tournament-bracket/tournament-bracket.service';

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentBracketController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
    private readonly bracketService: TournamentBracketService,
  ) {}

  // GET /admin/v1/tournaments/:id/bracket
  @Get(':id/bracket')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_READ)
  async getBracket(@Param('id') rawId: string): Promise<BracketProjectionDto> {
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.requireTournament(id);

    const { items: participants } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      1,
      1000,
    );

    return this.bracketService.getBracket(tournament._id, tournament.format, participants);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async requireTournament(id: string) {
    const tournament = await this.tournamentService.findById(id);
    if (!tournament) throw new NotFoundException('Tournament not found.');
    return tournament;
  }
}
