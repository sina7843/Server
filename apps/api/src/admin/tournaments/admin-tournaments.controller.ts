import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import type {
  TournamentDto,
  TournamentListResponseDto,
  TournamentStatus,
  TournamentFormat,
} from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import {
  parseAdminCreateTournamentBody,
  parseAdminUpdateTournamentBody,
  parseLifecycleActionBody,
} from './dto/admin-tournament-body';
import {
  toAdminTournamentResponse,
  toAdminTournamentListResponse,
} from './dto/admin-tournament-response';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_TOURNAMENT_STATUSES = new Set<string>([
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
]);

const VALID_TOURNAMENT_FORMATS = new Set<string>(['single_elimination', 'round_robin', 'manual']);

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentsController {
  constructor(
    private readonly tournamentService: TournamentService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  @Get()
  @RequirePermission(Permissions.TOURNAMENT_READ)
  async listTournaments(
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('gameId') gameId?: string,
    @Query('status') rawStatus?: string,
    @Query('format') rawFormat?: string,
  ): Promise<TournamentListResponseDto> {
    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    const statusFilter =
      rawStatus !== undefined && VALID_TOURNAMENT_STATUSES.has(rawStatus)
        ? (rawStatus as TournamentStatus)
        : undefined;

    const formatFilter =
      rawFormat !== undefined && VALID_TOURNAMENT_FORMATS.has(rawFormat)
        ? (rawFormat as TournamentFormat)
        : undefined;

    const { items, total } = await this.tournamentService.list(
      {
        ...(gameId !== undefined ? { gameId } : {}),
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
        ...(formatFilter !== undefined ? { format: formatFilter } : {}),
      },
      page,
      limit,
    );

    return toAdminTournamentListResponse(items, total, page, limit);
  }

  @Get(':id')
  @RequirePermission(Permissions.TOURNAMENT_READ)
  async getTournament(@Param('id') rawId: string): Promise<TournamentDto> {
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.findById(id);
    if (!tournament) throw new NotFoundException('Tournament not found.');
    return toAdminTournamentResponse(tournament);
  }

  @Post()
  @RequirePermission(Permissions.TOURNAMENT_CREATE)
  async createTournament(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    const input = parseAdminCreateTournamentBody(body);
    const tournament = await this.tournamentService.create(input);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_CREATED,
      resourceType: 'tournament',
      resourceId: String(tournament._id),
      after: {
        title: tournament.title,
        slug: tournament.slug,
        status: tournament.status,
        format: tournament.format,
      },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Patch(':id')
  @RequirePermission(Permissions.TOURNAMENT_UPDATE)
  async updateTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateTournamentBody(body);
    const tournament = await this.tournamentService.update(id, input);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_UPDATED,
      resourceType: 'tournament',
      resourceId: id,
      after: {
        title: tournament.title,
        slug: tournament.slug,
        status: tournament.status,
        format: tournament.format,
      },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Delete(':id')
  @RequirePermission(Permissions.TOURNAMENT_ARCHIVE)
  async deleteTournament(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const id = validateObjectId(rawId, 'id');
    await this.tournamentService.softDelete(id);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_DELETED,
      resourceType: 'tournament',
      resourceId: id,
      severity: 'warning',
    });
    return { success: true, message: 'Tournament deleted.' };
  }

  @Post(':id/publish')
  @RequirePermission(Permissions.TOURNAMENT_PUBLISH)
  async publishTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'published');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_PUBLISHED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/open-registration')
  @RequirePermission(Permissions.TOURNAMENT_PUBLISH)
  async openRegistration(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'registration_open');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_REGISTRATION_OPENED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/close-registration')
  @RequirePermission(Permissions.TOURNAMENT_PUBLISH)
  async closeRegistration(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'registration_closed');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_REGISTRATION_CLOSED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/start')
  @RequirePermission(Permissions.TOURNAMENT_PUBLISH)
  async startTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'in_progress');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_STARTED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/complete')
  @RequirePermission(Permissions.TOURNAMENT_PUBLISH)
  async completeTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'completed');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_COMPLETED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/cancel')
  @RequirePermission(Permissions.TOURNAMENT_CANCEL)
  async cancelTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'cancelled');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_CANCELLED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'warning',
    });
    return toAdminTournamentResponse(tournament);
  }

  @Post(':id/archive')
  @RequirePermission(Permissions.TOURNAMENT_ARCHIVE)
  async archiveTournament(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<TournamentDto> {
    parseLifecycleActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const tournament = await this.tournamentService.transition(id, 'archived');
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_ARCHIVED,
      resourceType: 'tournament',
      resourceId: id,
      after: { status: tournament.status },
      severity: 'info',
    });
    return toAdminTournamentResponse(tournament);
  }
}
