import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { TournamentStandingsDto, RecalculateStandingsResultDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentParticipantService } from '../../tournament-participants/tournament-participant.service';
import { TournamentStandingsService } from '../../tournament-standings/tournament-standings.service';

// Static route 'recalculate' must be declared BEFORE dynamic ':id' sub-paths
// to avoid NestJS treating 'recalculate' as a param value.

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentStandingsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
    private readonly standingsService: TournamentStandingsService,
  ) {}

  // GET /admin/v1/tournaments/:id/standings
  @Get(':id/standings')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_READ)
  async getStandings(@Param('id') rawId: string): Promise<TournamentStandingsDto> {
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.requireTournament(id);

    const { items: participants } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      1,
      1000,
    );

    return this.standingsService.getStandings(tournament._id, tournament.format, participants);
  }

  // POST /admin/v1/tournaments/:id/standings/recalculate
  @Post(':id/standings/recalculate')
  @RequirePermission(Permissions.TOURNAMENT_RESULT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async recalculateStandings(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RecalculateStandingsResultDto> {
    const id = validateObjectId(rawId, 'id');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);

    const { items: participants } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      1,
      1000,
    );

    return this.standingsService.recalculate(
      tournament._id,
      tournament.format,
      participants,
      adminUserId,
    );
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.auth?.userId;
    if (!userId) throw new UnauthorizedException('Authentication required.');
    return userId;
  }

  private async requireTournament(id: string) {
    const tournament = await this.tournamentService.findById(id);
    if (!tournament) throw new NotFoundException('Tournament not found.');
    return tournament;
  }
}
