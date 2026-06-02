import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import type { TournamentMatchResultDto } from '@dragon/types';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentMatchRepository } from './tournament-match.repository';
import { toResultDto } from './tournament-result-projection';

// Public results endpoint: read-only projection of completed matches with results.
// No public result detail route (no per-match detail endpoint).
// No public result mutation route.
// No live result feed.

@Controller('api/v1/tournaments')
export class PublicTournamentResultsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly matchRepository: TournamentMatchRepository,
  ) {}

  // GET /api/v1/tournaments/:slug/results
  // Public read — no auth required.
  // Returns all completed matches with result data as a flat list.
  @Get(':slug/results')
  async getResults(@Param('slug') slug: string): Promise<readonly TournamentMatchResultDto[]> {
    const tournament = await this.tournamentService.findBySlug(slug);
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }

    const { items } = await this.matchRepository.list(tournament._id, {
      status: 'completed',
      limit: 1000,
    });

    return items.filter((m) => m.winnerId != null).map((m) => toResultDto(m));
  }
}
