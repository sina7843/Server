import type { BracketProjectionDto } from '@dragon/types';

// Bracket read access uses the tournament.match.read permission policy.
// GET access only — bracket is a computed projection, not a mutable resource.
export interface AdminTournamentBracketClient {
  get(tournamentId: string): Promise<BracketProjectionDto>;
}
