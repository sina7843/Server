import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminTournamentRegistrationDto,
  RegistrationStatus,
  TournamentRegistrationType,
} from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TournamentService } from '../../tournaments/tournament.service';
import { TournamentRegistrationService } from '../../tournament-registrations/tournament-registration.service';
import {
  toAdminRegistrationDto,
  toAdminRegistrationListResponse,
} from '../../tournament-registrations/tournament-registration-projection';
import {
  parseAdminRejectBody,
  parseAdminRegistrationActionBody,
} from '../../tournament-registrations/dto/registration-body';
// Local shape for list response (mirrors SDK AdminTournamentRegistrationListResponseDto).
interface AdminTournamentRegistrationListResponseDto {
  readonly items: readonly AdminTournamentRegistrationDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

const VALID_REGISTRATION_STATUSES = new Set<string>([
  'submitted',
  'approved',
  'rejected',
  'waitlisted',
  'withdrawn',
  'cancelled',
]);

const VALID_REGISTRATION_TYPES = new Set<string>(['individual', 'team']);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Controller('admin/v1/tournaments')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminTournamentRegistrationsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly registrationService: TournamentRegistrationService,
  ) {}

  // GET /admin/v1/tournaments/:id/registrations
  @Get(':id/registrations')
  @RequirePermission(Permissions.TOURNAMENT_REGISTRATION_READ)
  async listRegistrations(
    @Param('id') rawId: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('status') rawStatus?: string,
    @Query('type') rawType?: string,
  ): Promise<AdminTournamentRegistrationListResponseDto> {
    const id = validateObjectId(rawId, 'id');
    await this.requireTournamentExists(id);

    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    const statusFilter =
      rawStatus !== undefined && VALID_REGISTRATION_STATUSES.has(rawStatus)
        ? (rawStatus as RegistrationStatus)
        : undefined;

    const typeFilter =
      rawType !== undefined && VALID_REGISTRATION_TYPES.has(rawType)
        ? (rawType as TournamentRegistrationType)
        : undefined;

    const { items, total } = await this.registrationService.listForTournament(
      id,
      {
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
        ...(typeFilter !== undefined ? { type: typeFilter } : {}),
      },
      page,
      limit,
    );

    return toAdminRegistrationListResponse(items, total, page, limit);
  }

  // GET /admin/v1/tournaments/:id/registrations/:registrationId
  @Get(':id/registrations/:registrationId')
  @RequirePermission(Permissions.TOURNAMENT_REGISTRATION_READ)
  async getRegistration(
    @Param('id') rawId: string,
    @Param('registrationId') rawRegistrationId: string,
  ): Promise<AdminTournamentRegistrationDto> {
    const id = validateObjectId(rawId, 'id');
    const registrationId = validateObjectId(rawRegistrationId, 'registrationId');

    await this.requireTournamentExists(id);

    const registration = await this.registrationService.findById(registrationId);
    if (!registration) throw new NotFoundException('Registration not found.');
    if (String(registration.tournamentId) !== id) {
      throw new NotFoundException('Registration not found.');
    }

    return toAdminRegistrationDto(registration);
  }

  // POST /admin/v1/tournaments/:id/registrations/:registrationId/approve
  @Post(':id/registrations/:registrationId/approve')
  @RequirePermission(Permissions.TOURNAMENT_REGISTRATION_MANAGE)
  @HttpCode(HttpStatus.OK)
  async approveRegistration(
    @Param('id') rawId: string,
    @Param('registrationId') rawRegistrationId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentRegistrationDto> {
    parseAdminRegistrationActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const registrationId = validateObjectId(rawRegistrationId, 'registrationId');
    const adminUserId = this.requireUserId(req);

    await this.requireTournamentExists(id);
    await this.requireRegistrationBelongsToTournament(registrationId, id);

    const registration = await this.registrationService.approve(registrationId, adminUserId);
    return toAdminRegistrationDto(registration);
  }

  // POST /admin/v1/tournaments/:id/registrations/:registrationId/reject
  @Post(':id/registrations/:registrationId/reject')
  @RequirePermission(Permissions.TOURNAMENT_REGISTRATION_MANAGE)
  @HttpCode(HttpStatus.OK)
  async rejectRegistration(
    @Param('id') rawId: string,
    @Param('registrationId') rawRegistrationId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentRegistrationDto> {
    const id = validateObjectId(rawId, 'id');
    const registrationId = validateObjectId(rawRegistrationId, 'registrationId');
    const adminUserId = this.requireUserId(req);
    const { reason } = parseAdminRejectBody(body);

    await this.requireTournamentExists(id);
    await this.requireRegistrationBelongsToTournament(registrationId, id);

    const registration = await this.registrationService.reject(registrationId, adminUserId, reason);
    return toAdminRegistrationDto(registration);
  }

  // POST /admin/v1/tournaments/:id/registrations/:registrationId/cancel
  @Post(':id/registrations/:registrationId/cancel')
  @RequirePermission(Permissions.TOURNAMENT_REGISTRATION_MANAGE)
  @HttpCode(HttpStatus.OK)
  async cancelRegistration(
    @Param('id') rawId: string,
    @Param('registrationId') rawRegistrationId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTournamentRegistrationDto> {
    parseAdminRegistrationActionBody(body);
    const id = validateObjectId(rawId, 'id');
    const registrationId = validateObjectId(rawRegistrationId, 'registrationId');
    const adminUserId = this.requireUserId(req);

    await this.requireTournamentExists(id);
    await this.requireRegistrationBelongsToTournament(registrationId, id);

    const registration = await this.registrationService.cancel(registrationId, adminUserId);
    return toAdminRegistrationDto(registration);
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

  private async requireRegistrationBelongsToTournament(
    registrationId: string,
    tournamentId: string,
  ): Promise<void> {
    const registration = await this.registrationService.findById(registrationId);
    if (!registration) throw new NotFoundException('Registration not found.');
    if (String(registration.tournamentId) !== tournamentId) {
      throw new NotFoundException('Registration not found.');
    }
  }
}
