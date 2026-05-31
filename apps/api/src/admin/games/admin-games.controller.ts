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
import type { GameDto, GameListResponseDto } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { GameService } from '../../games/game.service';
import { parseAdminCreateGameBody, parseAdminUpdateGameBody } from './dto/admin-game-body';
import { toAdminGameListResponse, toAdminGameResponse } from './dto/admin-game-response';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_STATUSES = new Set(['active', 'inactive', 'archived']);

@Controller('admin/v1/games')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminGamesController {
  constructor(
    private readonly gameService: GameService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  @Get()
  @RequirePermission(Permissions.TOURNAMENT_GAME_READ)
  async listGames(
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('status') rawStatus?: string,
  ): Promise<GameListResponseDto> {
    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    const statusFilter =
      rawStatus !== undefined && VALID_STATUSES.has(rawStatus)
        ? (rawStatus as 'active' | 'inactive' | 'archived')
        : undefined;

    const { items, total } = await this.gameService.list(
      { ...(statusFilter !== undefined ? { status: statusFilter } : {}), includeDeleted: false },
      page,
      limit,
    );

    return toAdminGameListResponse(items, total, page, limit);
  }

  @Get(':id')
  @RequirePermission(Permissions.TOURNAMENT_GAME_READ)
  async getGame(@Param('id') rawId: string): Promise<GameDto> {
    const id = validateObjectId(rawId, 'id');
    const game = await this.gameService.findById(id);
    if (!game) throw new NotFoundException('Game not found.');
    return toAdminGameResponse(game);
  }

  @Post()
  @RequirePermission(Permissions.TOURNAMENT_GAME_MANAGE)
  async createGame(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<GameDto> {
    const input = parseAdminCreateGameBody(body);
    const game = await this.gameService.create(input);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_GAME_CREATED,
      resourceType: 'game',
      resourceId: String(game._id),
      after: { name: game.name, slug: game.slug, status: game.status },
      severity: 'info',
    });
    return toAdminGameResponse(game);
  }

  @Patch(':id')
  @RequirePermission(Permissions.TOURNAMENT_GAME_MANAGE)
  async updateGame(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<GameDto> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateGameBody(body);
    const game = await this.gameService.update(id, input);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_GAME_UPDATED,
      resourceType: 'game',
      resourceId: id,
      after: { name: game.name, slug: game.slug, status: game.status },
      severity: 'info',
    });
    return toAdminGameResponse(game);
  }

  @Delete(':id')
  @RequirePermission(Permissions.TOURNAMENT_GAME_MANAGE)
  async deleteGame(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const id = validateObjectId(rawId, 'id');
    await this.gameService.softDelete(id);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.TOURNAMENT_GAME_DELETED,
      resourceType: 'game',
      resourceId: id,
      severity: 'warning',
    });
    return { success: true, message: 'Game deleted.' };
  }
}
