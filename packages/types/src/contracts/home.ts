// ─── Esports home DTOs ───────────────────────────────────────────────────────

import type { PublicPostDto } from './content';
import type { TournamentListItemDto } from './tournaments';

export interface EsportsHomeDto {
  readonly featuredPosts: readonly PublicPostDto[];
  readonly latestNews: readonly PublicPostDto[];
  readonly activeTournaments: readonly TournamentListItemDto[];
  readonly upcomingTournaments: readonly TournamentListItemDto[];
  readonly topContent: readonly PublicPostDto[];
}
