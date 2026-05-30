// ─── Esports home DTOs ───────────────────────────────────────────────────────

import type { TournamentListItemDto } from './tournaments';

export interface EsportsHomeDto {
  readonly featuredTournaments: readonly TournamentListItemDto[];
}
