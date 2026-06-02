import type { Types } from 'mongoose';
import type { TournamentMatchStatus } from '@dragon/types';

export type MatchId = string;

export interface CreateMatchInput {
  readonly round: number;
  readonly matchNumber: number;
  readonly participant1Id?: Types.ObjectId;
  readonly participant2Id?: Types.ObjectId;
  readonly scheduledAt?: Date;
}

export interface UpdateMatchInput {
  readonly participant1Id?: Types.ObjectId | null;
  readonly participant2Id?: Types.ObjectId | null;
  readonly scheduledAt?: Date | null;
  readonly notes?: string;
}

export interface MatchRepositoryPatch {
  readonly participant1Id?: Types.ObjectId | null;
  readonly participant2Id?: Types.ObjectId | null;
  readonly scheduledAt?: Date | null;
  readonly notes?: string;
  readonly status?: TournamentMatchStatus;
  readonly completedAt?: Date | null;
  readonly winnerId?: Types.ObjectId | null;
  readonly participant1Score?: number | null;
  readonly participant2Score?: number | null;
  readonly resultNotes?: string | null;
  readonly resultRecordedAt?: Date | null;
}

export interface MatchListFilter {
  readonly page?: number;
  readonly limit?: number;
  readonly round?: number;
  readonly status?: TournamentMatchStatus;
}
