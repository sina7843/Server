import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { TournamentMatchListResponseDto } from '@dragon/types';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentMatchService } from './tournament-match.service';
import { toPublicMatchListResponse } from './tournament-match-projection';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Controller('api/v1/tournaments')
export class PublicTournamentMatchesController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly matchService: TournamentMatchService,
  ) {}

  // GET /api/v1/tournaments/:slug/matches
  // Public read — no auth required.
  // Only accessible for publicly visible tournaments.
  @Get(':slug/matches')
  async listMatches(
    @Param('slug') slug: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('round') rawRound?: string,
  ): Promise<TournamentMatchListResponseDto> {
    const tournament = await this.tournamentService.findBySlug(slug);
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }

    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;
    const round =
      rawRound !== undefined && /^\d+$/.test(rawRound) ? parseInt(rawRound, 10) : undefined;

    const filter = round !== undefined ? { page, limit, round } : { page, limit };
    const { items, total } = await this.matchService.listMatches(tournament._id, filter);

    return toPublicMatchListResponse(items, total, page, limit);
  }
}
