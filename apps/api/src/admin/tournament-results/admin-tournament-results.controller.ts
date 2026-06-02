import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { TournamentMatchResultDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentResultService } from '../../tournament-matches/tournament-result.service';
import {
  parseCreateResultBody,
  parseUpdateResultBody,
} from '../../tournament-matches/dto/result-body';

// Result endpoints follow the same URL structure as match endpoints:
//   POST  /admin/v1/tournaments/:id/matches/:matchId/result
//   PATCH /admin/v1/tournaments/:id/matches/:matchId/result
//   POST  /admin/v1/tournaments/:id/matches/:matchId/result/void
//
// The 'result/void' route is a static sub-path and must be declared BEFORE
// the generic 'result' routes to prevent NestJS from treating 'void' as a param.

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentResultsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly resultService: TournamentResultService,
  ) {}

  // POST /admin/v1/tournaments/:id/matches/:matchId/result/void
  // Declared BEFORE the PATCH route to avoid routing conflicts.
  @Post(':id/matches/:matchId/result/void')
  @RequirePermission(Permissions.TOURNAMENT_RESULT_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async voidResult(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);

    await this.resultService.void(rawMatchId, tournament._id, tournament.status, adminUserId);
  }

  // POST /admin/v1/tournaments/:id/matches/:matchId/result
  @Post(':id/matches/:matchId/result')
  @RequirePermission(Permissions.TOURNAMENT_RESULT_MANAGE)
  async recordResult(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentMatchResultDto> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);
    const input = parseCreateResultBody(body);

    return this.resultService.record(
      rawMatchId,
      tournament._id,
      tournament.status,
      input,
      adminUserId,
    );
  }

  // PATCH /admin/v1/tournaments/:id/matches/:matchId/result
  @Patch(':id/matches/:matchId/result')
  @RequirePermission(Permissions.TOURNAMENT_RESULT_MANAGE)
  async updateResult(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentMatchResultDto> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);
    const input = parseUpdateResultBody(body);

    return this.resultService.update(
      rawMatchId,
      tournament._id,
      tournament.status,
      input,
      adminUserId,
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

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
