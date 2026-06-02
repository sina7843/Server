import type { Types } from 'mongoose';
import type { CreateMatchInput } from './tournament-match.types';

// ─── Power-of-two guard ───────────────────────────────────────────────────────
//
// Phase 1 single_elimination generation requires a power-of-two participant
// count (2, 4, 8, 16, ...). Non-power-of-two counts produce incomplete first-
// round matches that cannot be completed (result recording requires both slots
// filled). Admins may use manual match creation for non-power-of-two setups
// until a future bye / advanced bracket policy exists.

export function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

// ─── Single Elimination ───────────────────────────────────────────────────────
//
// Generates only round 1 pairings. Subsequent rounds are created manually
// as results are recorded. Seeded by position: 1v2, 3v4, etc.
// Caller must ensure participant count is a power of two (see isPowerOfTwo).

export function generateSingleEliminationRound1(
  participantIds: Types.ObjectId[],
): CreateMatchInput[] {
  const matches: CreateMatchInput[] = [];
  let matchNumber = 1;

  for (let i = 0; i < participantIds.length; i += 2) {
    // participantIds[i] is guaranteed defined: i < participantIds.length.
    const p1 = participantIds[i] as Types.ObjectId;
    const p2 = participantIds[i + 1] as Types.ObjectId | undefined;
    const input: CreateMatchInput = p2
      ? { round: 1, matchNumber, participant1Id: p1, participant2Id: p2 }
      : { round: 1, matchNumber, participant1Id: p1 };
    matches.push(input);
    matchNumber++;
  }

  return matches;
}

// ─── Round Robin ─────────────────────────────────────────────────────────────
//
// Berger circle method: generates a complete round-robin schedule.
// All rounds are generated at once. With N participants:
//   - Even N: (N-1) rounds, N/2 matches per round.
//   - Odd N: N rounds, floor(N/2) matches per round (one bye per round, omitted).
//
// Bye matches are excluded — the bye slot participant gets no match that round.

export function generateRoundRobin(participantIds: Types.ObjectId[]): CreateMatchInput[] {
  const n = participantIds.length;
  if (n < 2) return [];

  // For odd count, add a null placeholder (bye).
  const ids: (Types.ObjectId | null)[] = [...participantIds];
  if (n % 2 !== 0) ids.push(null);

  const teamCount = ids.length;
  const rounds = teamCount - 1;
  const matchesPerRound = teamCount / 2;

  const matches: CreateMatchInput[] = [];

  // Fixed pivot: last element. Rotate all others (Berger circle).
  for (let round = 0; round < rounds; round++) {
    let matchNumber = 1;

    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = ids[i] ?? null;
      const p2 = ids[teamCount - 1 - i] ?? null;

      // Skip bye matches (null slot).
      if (p1 !== null && p2 !== null) {
        matches.push({
          round: round + 1,
          matchNumber,
          participant1Id: p1,
          participant2Id: p2,
        });
        matchNumber++;
      }
    }

    // Rotate: shift elements [1..teamCount-2] right by one, wrap last into [1].
    const last = ids[teamCount - 2];
    for (let i = teamCount - 2; i > 1; i--) {
      ids[i] = ids[i - 1] as Types.ObjectId | null;
    }
    ids[1] = last as Types.ObjectId | null;
  }

  return matches;
}
