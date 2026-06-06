import { Controller, Get, NotFoundException, Optional, Param } from '@nestjs/common';
import type { TournamentBracketDto } from '@dragon/types';
import { AnalyticsService } from '../analytics/analytics.service';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentParticipantService } from '../tournament-participants/tournament-participant.service';
import { TournamentBracketService } from './tournament-bracket.service';

@Controller('api/v1/tournaments')
export class PublicTournamentBracketController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly participantService: TournamentParticipantService,
    private readonly bracketService: TournamentBracketService,
    @Optional() private readonly analyticsService?: AnalyticsService,
  ) {}

  // GET /api/v1/tournaments/:slug/bracket
  // Public read — no auth required.
  // Only accessible for publicly visible tournaments.
  @Get(':slug/bracket')
  async getBracket(@Param('slug') slug: string): Promise<TournamentBracketDto> {
    const tournament = await this.tournamentService.findBySlug(slug);
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }

    this.analyticsService?.track({
      type: 'tournament.bracket_viewed',
      resourceType: 'tournament',
      resourceId: String(tournament._id),
      metadata: { slug },
    });

    const { items: participants } = await this.participantService.listParticipants(
      tournament._id,
      undefined,
      1,
      1000,
    );

    return this.bracketService.getBracket(tournament._id, tournament.format, participants);
  }
}
