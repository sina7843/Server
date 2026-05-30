import type { BracketProjectionDto } from '@dragon/types';

// Bracket read access uses the tournament.match.read permission policy.
// No editable bracket, no drag/drop, no manual override methods.
export interface AdminTournamentBracketClient {
  get(tournamentId: string): Promise<BracketProjectionDto>;
}
