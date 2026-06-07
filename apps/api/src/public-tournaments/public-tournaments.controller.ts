import { Controller, Get, NotFoundException, Optional, Param, Query } from '@nestjs/common';
import { parseOptionalBooleanQuery } from '../common/query-parsers';
import type {
  TournamentDetailDto,
  TournamentListResponseDto,
  TournamentStatus,
  TournamentFormat,
} from '@dragon/types';
import { AnalyticsService } from '../analytics/analytics.service';
import { TournamentService } from '../tournaments/tournament.service';
import {
  isPubliclyVisible,
  toPublicTournamentDetail,
  toPublicTournamentListResponse,
} from '../tournaments/tournament-projection';

// ─── Public list / detail endpoints ──────────────────────────────────────────
//
// GET /api/v1/tournaments        — structured listing with public-safe filters.
// GET /api/v1/tournaments/:slug  — public-safe tournament detail by slug.
//
// Text search is NOT accepted here. Use GET /api/v1/search/tournaments instead.
// draft, archived, and deleted tournaments are never exposed.
// cancelled tournaments are visible for transparency (CTAs enforced in frontend).

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Statuses that the public filter accepts.
// draft, archived, and deleted state are never accepted or returned.
const PUBLIC_SAFE_STATUSES = new Set<string>([
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
]);

const PUBLIC_SAFE_STATUSES_ARRAY: readonly TournamentStatus[] = [
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
];

const VALID_FORMATS = new Set<string>(['single_elimination', 'round_robin', 'manual']);

@Controller('api/v1/tournaments')
export class PublicTournamentsController {
  constructor(
    private readonly tournamentService: TournamentService,
    @Optional() private readonly analyticsService?: AnalyticsService,
  ) {}

  // GET /api/v1/tournaments
  // Structured public listing. Filters: gameId, status, format, registrationOpen, page, limit.
  // No text/q search — use GET /api/v1/search/tournaments for that.
  @Get()
  async list(
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('gameId') gameId?: string,
    @Query('status') rawStatus?: string,
    @Query('format') rawFormat?: string,
    @Query('registrationOpen') rawRegistrationOpen?: string,
  ): Promise<TournamentListResponseDto> {
    const page =
      rawPage !== undefined ? Math.max(1, parseInt(rawPage, 10) || DEFAULT_PAGE) : DEFAULT_PAGE;
    const limit =
      rawLimit !== undefined
        ? Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT))
        : DEFAULT_LIMIT;

    // Only allow public-safe statuses; draft/archived/unknown values are silently ignored.
    const statusFilter =
      rawStatus !== undefined && PUBLIC_SAFE_STATUSES.has(rawStatus)
        ? (rawStatus as TournamentStatus)
        : undefined;

    const formatFilter =
      rawFormat !== undefined && VALID_FORMATS.has(rawFormat)
        ? (rawFormat as TournamentFormat)
        : undefined;

    const registrationOpen = parseOptionalBooleanQuery(rawRegistrationOpen);

    const { items, total } = await this.tournamentService.list(
      {
        ...(gameId !== undefined ? { gameId } : {}),
        // When an explicit status filter is provided it takes precedence.
        // When none is provided, restrict to public-safe statuses to exclude draft/archived.
        ...(statusFilter !== undefined
          ? { status: statusFilter }
          : { statuses: PUBLIC_SAFE_STATUSES_ARRAY }),
        ...(formatFilter !== undefined ? { format: formatFilter } : {}),
        ...(registrationOpen !== undefined ? { registrationOpen } : {}),
      },
      page,
      limit,
    );

    return toPublicTournamentListResponse(items, total, page, limit);
  }

  // GET /api/v1/tournaments/:slug
  // Public-safe tournament detail. Returns 404 for draft/deleted/archived — no state leak.
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<TournamentDetailDto> {
    const tournament = await this.tournamentService.findBySlug(slug);

    // Return 404 whether the tournament doesn't exist or is not public-safe.
    // This prevents leaking whether a tournament is draft, deleted, or archived.
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }

    this.analyticsService?.track({
      type: 'tournament.viewed',
      resourceType: 'tournament',
      resourceId: String(tournament._id),
      metadata: { slug: tournament.slug },
    });

    return toPublicTournamentDetail(tournament);
  }
}
