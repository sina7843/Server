// ─── Esports home DTOs ────────────────────────────────────────────────────────

import type { TournamentSummaryDto } from './tournaments';
import type { GamePublicDto } from './games';

export interface EsportsHomeDto {
  readonly featuredTournaments: readonly TournamentSummaryDto[];
  readonly games: readonly GamePublicDto[];
}
