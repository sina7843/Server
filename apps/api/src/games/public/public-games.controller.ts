import { Controller, Get, Query } from '@nestjs/common';
import type { GamePublicListResponseDto } from '@dragon/types';
import { GameService } from '../game.service';
import { GameEnrichmentService } from '../game-enrichment.service';
import { toPublicGameListResponse } from './dto/public-game-response';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Controller('api/v1/games')
export class PublicGamesController {
  constructor(
    private readonly gameService: GameService,
    private readonly enrichmentService: GameEnrichmentService,
  ) {}

  @Get()
  async listGames(
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ): Promise<GamePublicListResponseDto> {
    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    const { items, total } = await this.gameService.list(
      { status: 'active', includeDeleted: false },
      page,
      limit,
    );

    const enrichmentMap = await this.enrichmentService.enrichMany(items);
    return toPublicGameListResponse(items, total, page, limit, enrichmentMap);
  }
}
