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
import type { TournamentParticipantDto } from '@dragon/types';
import type { ParticipantStatus } from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentParticipantService } from '../../tournament-participants/tournament-participant.service';
import {
  toParticipantDto,
  toAdminParticipantListResponse,
} from '../../tournament-participants/tournament-participant-projection';
import {
  parseUpdateParticipantBody,
  parseParticipantActionBody,
} from '../../tournament-participants/dto/participant-body';

// Local shape for list response (mirrors SDK AdminTournamentParticipantListResponseDto).
interface AdminParticipantListResponseDto {
  readonly items: readonly TournamentParticipantDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

const VALID_PARTICIPANT_STATUSES = new Set<string>([
  'active',
  'withdrawn',
  'disqualified',
  'removed',
]);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ─── Admin participant endpoints ──────────────────────────────────────────────
//
// Participants are derived projections from approved registrations.
// participantId == registrationId (same ObjectId).
//
// No admin participant UI routes are created here.
// No match/standing/bracket side effects.
// Remove/disqualify use explicit service methods — generic PATCH cannot bypass
// participant status policy (assertParticipantIsActive is called in service).

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentParticipantsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
  ) {}

  // GET /admin/v1/tournaments/:id/participants
  @Get(':id/participants')
  @RequirePermission(Permissions.TOURNAMENT_PARTICIPANT_READ)
  async listParticipants(
    @Param('id') rawId: string,
    @Query('status') rawStatus?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ): Promise<AdminParticipantListResponseDto> {
    const id = validateObjectId(rawId, 'id');
    await this.requireTournamentExists(id);

    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    const statusFilter =
      rawStatus !== undefined && VALID_PARTICIPANT_STATUSES.has(rawStatus)
        ? (rawStatus as ParticipantStatus)
        : undefined;

    const { items, total } = await this.participantService.listParticipants(
      id,
      statusFilter,
      page,
      limit,
    );

    return toAdminParticipantListResponse(items, total, page, limit);
  }

  // PATCH /admin/v1/tournaments/:id/participants/:participantId
  @Patch(':id/participants/:participantId')
  @RequirePermission(Permissions.TOURNAMENT_PARTICIPANT_MANAGE)
  async updateParticipant(
    @Param('id') rawId: string,
    @Param('participantId') rawParticipantId: string,
    @Body() body: unknown,
  ): Promise<TournamentParticipantDto> {
    const id = validateObjectId(rawId, 'id');
    const participantId = validateObjectId(rawParticipantId, 'participantId');
    const input = parseUpdateParticipantBody(body);

    await this.requireTournamentExists(id);

    const updated = await this.participantService.updateParticipant(participantId, id, input);
    return toParticipantDto(updated);
  }

  // POST /admin/v1/tournaments/:id/participants/:participantId/remove
  @Post(':id/participants/:participantId/remove')
  @RequirePermission(Permissions.TOURNAMENT_PARTICIPANT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async removeParticipant(
    @Param('id') rawId: string,
    @Param('participantId') rawParticipantId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    parseParticipantActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const participantId = validateObjectId(rawParticipantId, 'participantId');
    const adminUserId = this.requireUserId(req);

    await this.requireTournamentExists(id);
    await this.participantService.removeParticipant(participantId, id, adminUserId);
  }

  // POST /admin/v1/tournaments/:id/participants/:participantId/disqualify
  @Post(':id/participants/:participantId/disqualify')
  @RequirePermission(Permissions.TOURNAMENT_PARTICIPANT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async disqualifyParticipant(
    @Param('id') rawId: string,
    @Param('participantId') rawParticipantId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentParticipantDto> {
    parseParticipantActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const participantId = validateObjectId(rawParticipantId, 'participantId');
    const adminUserId = this.requireUserId(req);

    await this.requireTournamentExists(id);

    const updated = await this.participantService.disqualifyParticipant(
      participantId,
      id,
      adminUserId,
    );
    return toParticipantDto(updated);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.auth?.userId;
    if (!userId) throw new UnauthorizedException('Authentication required.');
    return userId;
  }

  private async requireTournamentExists(id: string): Promise<void> {
    const tournament = await this.tournamentService.findById(id);
    if (!tournament) throw new NotFoundException('Tournament not found.');
  }
}
