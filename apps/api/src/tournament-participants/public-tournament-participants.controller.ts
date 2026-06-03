import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { TournamentParticipantListResponseDto } from '@dragon/types';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentParticipantService } from './tournament-participant.service';
import { toPublicParticipantListResponse } from './tournament-participant-projection';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Controller('api/v1/tournaments')
export class PublicTournamentParticipantsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
  ) {}

  // GET /api/v1/tournaments/:slug/participants
  // Public read — no auth required.
  // Only accessible for publicly visible tournaments.
  @Get(':slug/participants')
  async listParticipants(
    @Param('slug') slug: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ): Promise<TournamentParticipantListResponseDto> {
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

    const { items, total } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      page,
      limit,
    );

    return toPublicParticipantListResponse(items, total, page, limit);
  }
}
