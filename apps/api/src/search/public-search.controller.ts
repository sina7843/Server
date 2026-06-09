import { Controller, Get, Query } from '@nestjs/common';
import type {
  SearchResultResponseDto,
  TournamentListResponseDto,
  TournamentStatus,
} from '@dragon/types';
import { SearchService } from './search.service';
import { parsePublicContentSearchQuery } from './dto/public-search-query';
import { parseTournamentSearchQuery } from './dto/tournament-search-query';
import { toSearchResultResponse } from './dto/search-response';
import { TournamentService } from '../tournaments/tournament.service';
import { TournamentEnrichmentService } from '../tournaments/tournament-enrichment.service';
import { toPublicTournamentListResponse } from '../tournaments/tournament-projection';

// Public-safe tournament statuses — draft and archived are never exposed.
const PUBLIC_SAFE_TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
];

@Controller('api/v1/search')
export class PublicSearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly tournamentService: TournamentService,
    private readonly enrichmentService: TournamentEnrichmentService,
  ) {}

  @Get('content')
  async searchContent(@Query() query: unknown): Promise<SearchResultResponseDto> {
    const parsed = parsePublicContentSearchQuery(query);
    const result = await this.searchService.searchPublicContent(parsed);
    return toSearchResultResponse(result);
  }

  // GET /api/v1/search/tournaments
  // Public-safe tournament text search. Separate from GET /api/v1/tournaments (structured list).
  // draft, deleted, and archived tournaments are never included.
  // cancelled is included for transparency (same policy as the list endpoint).
  @Get('tournaments')
  async searchTournaments(@Query() query: unknown): Promise<TournamentListResponseDto> {
    const parsed = parseTournamentSearchQuery(query);

    const { items, total } = await this.tournamentService.list(
      {
        ...(parsed.gameId !== undefined ? { gameId: parsed.gameId } : {}),
        // When an explicit public-safe status is provided it takes precedence.
        // Otherwise restrict to all public-safe statuses (excludes draft/archived).
        ...(parsed.status !== undefined
          ? { status: parsed.status }
          : { statuses: PUBLIC_SAFE_TOURNAMENT_STATUSES }),
        ...(parsed.format !== undefined ? { format: parsed.format } : {}),
        ...(parsed.registrationOpen !== undefined
          ? { registrationOpen: parsed.registrationOpen }
          : {}),
        ...(parsed.q !== undefined ? { titleSearch: parsed.q } : {}),
      },
      parsed.page,
      parsed.limit,
    );

    const enrichmentMap = await this.enrichmentService.enrichMany(items);
    return toPublicTournamentListResponse(items, total, parsed.page, parsed.limit, enrichmentMap);
  }
}
