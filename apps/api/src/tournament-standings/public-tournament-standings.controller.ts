import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import type { TournamentStandingsDto } from '@dragon/types';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentParticipantService } from '../tournament-participants/tournament-participant.service';
import { TournamentStandingsService } from './tournament-standings.service';

@Controller('api/v1/tournaments')
export class PublicTournamentStandingsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
    private readonly standingsService: TournamentStandingsService,
  ) {}

  // GET /api/v1/tournaments/:slug/standings
  // Public read — no auth required.
  // Only accessible for publicly visible tournaments.
  @Get(':slug/standings')
  async getStandings(@Param('slug') slug: string): Promise<TournamentStandingsDto> {
    const tournament = await this.tournamentService.findBySlug(slug);
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }

    const { items: participants } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      1,
      1000,
    );

    return this.standingsService.getStandings(tournament._id, tournament.format, participants);
  }
}
