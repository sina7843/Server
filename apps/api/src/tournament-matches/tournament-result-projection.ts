import type { TournamentMatchResultDto } from '@dragon/types';
import type { TournamentMatchDocument } from './tournament-match.schema';

// Projects a completed TournamentMatch document to a TournamentMatchResultDto.
// Only call this on matches with status === 'completed' and winnerId set.

export function toResultDto(doc: TournamentMatchDocument): TournamentMatchResultDto {
  return {
    matchId: String(doc._id),
    tournamentId: String(doc.tournamentId),
    winnerId: String(doc.winnerId),
    recordedAt: (doc.resultRecordedAt ?? doc.completedAt ?? doc.updatedAt).toISOString(),
    ...(doc.participant1Score !== undefined && { participant1Score: doc.participant1Score }),
    ...(doc.participant2Score !== undefined && { participant2Score: doc.participant2Score }),
  };
}
