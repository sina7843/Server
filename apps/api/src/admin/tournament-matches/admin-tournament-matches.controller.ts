import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { AdminTournamentMatchDto } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentParticipantService } from '../../tournament-participants/tournament-participant.service';
import { TournamentMatchService } from '../../tournament-matches/tournament-match.service';
import {
  toAdminMatchDto,
  toAdminMatchListResponse,
} from '../../tournament-matches/tournament-match-projection';
import {
  parseCreateMatchBody,
  parseUpdateMatchBody,
} from '../../tournament-matches/dto/match-body';

interface AdminTournamentMatchListResponseDto {
  readonly items: readonly AdminTournamentMatchDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Static route 'generate' must be declared before the dynamic ':matchId' route
// so NestJS resolves it before treating 'generate' as a matchId parameter.

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentMatchesController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
    private readonly matchService: TournamentMatchService,
  ) {}

  // GET /admin/v1/tournaments/:id/matches
  @Get(':id/matches')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_READ)
  async listMatches(
    @Param('id') rawId: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('round') rawRound?: string,
    @Query('status') rawStatus?: string,
  ): Promise<AdminTournamentMatchListResponseDto> {
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.requireTournament(id);

    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;
    const round =
      rawRound !== undefined && /^\d+$/.test(rawRound) ? parseInt(rawRound, 10) : undefined;
    const status = rawStatus as AdminTournamentMatchDto['status'] | undefined;

    const filter = {
      page,
      limit,
      ...(round !== undefined && { round }),
      ...(status !== undefined && { status }),
    };
    const { items, total } = await this.matchService.listMatches(tournament._id, filter);

    return toAdminMatchListResponse(items, total, page, limit);
  }

  // POST /admin/v1/tournaments/:id/matches
  @Post(':id/matches')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_MANAGE)
  async createMatch(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentMatchDto> {
    const id = validateObjectId(rawId, 'id');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);
    const input = parseCreateMatchBody(body);

    const match = await this.matchService.createMatch(tournament._id, input, adminUserId);
    return toAdminMatchDto(match);
  }

  // POST /admin/v1/tournaments/:id/matches/generate
  // Declared BEFORE :matchId to avoid routing conflict.
  @Post(':id/matches/generate')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_MANAGE)
  @HttpCode(HttpStatus.OK)
  async generateMatches(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentMatchListResponseDto> {
    const id = validateObjectId(rawId, 'id');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);

    const participantIds = await this.participantService.findActiveForGeneration(tournament._id);

    const matches = await this.matchService.generateMatches(
      tournament._id,
      tournament.status,
      tournament.format,
      participantIds,
      adminUserId,
    );

    return toAdminMatchListResponse(matches, matches.length, 1, matches.length || 1);
  }

  // GET /admin/v1/tournaments/:id/matches/:matchId
  @Get(':id/matches/:matchId')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_READ)
  async getMatch(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
  ): Promise<AdminTournamentMatchDto> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const tournament = await this.requireTournament(id);

    const match = await this.matchService.findById(rawMatchId, tournament._id);
    return toAdminMatchDto(match);
  }

  // PATCH /admin/v1/tournaments/:id/matches/:matchId
  @Patch(':id/matches/:matchId')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_MANAGE)
  async updateMatch(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentMatchDto> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);
    const input = parseUpdateMatchBody(body);

    const match = await this.matchService.updateMatch(
      rawMatchId,
      tournament._id,
      input,
      adminUserId,
    );
    return toAdminMatchDto(match);
  }

  // POST /admin/v1/tournaments/:id/matches/:matchId/cancel
  @Post(':id/matches/:matchId/cancel')
  @RequirePermission(Permissions.TOURNAMENT_MATCH_MANAGE)
  @HttpCode(HttpStatus.OK)
  async cancelMatch(
    @Param('id') rawId: string,
    @Param('matchId') rawMatchId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentMatchDto> {
    const id = validateObjectId(rawId, 'id');
    validateObjectId(rawMatchId, 'matchId');
    const adminUserId = this.requireUserId(req);
    const tournament = await this.requireTournament(id);

    const match = await this.matchService.cancelMatch(rawMatchId, tournament._id, adminUserId);
    return toAdminMatchDto(match);
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
