import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import type {
  TournamentFormat,
  BracketProjectionDto,
  BracketRoundDto,
  BracketMatchNodeDto,
  BracketParticipantSeedDto,
} from '@dragon/types';
import { TournamentMatchRepository } from '../tournament-matches/tournament-match.repository';
import type { TournamentMatchDocument } from '../tournament-matches/tournament-match.schema';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Bracket projection policy ────────────────────────────────────────────────
//
// Bracket is projected from TournamentMatch records — no TournamentBracket
// collection, no bracket persistence model, no editable bracket state.
//
// Rounds are grouped by match.round and sorted ascending.
// Round labels:
//   single_elimination: named labels for last rounds (Final, Semifinal, etc.)
//                       if total rounds allow. Otherwise "Round N".
//   round_robin / manual: "Round N" labels.
//
// Participant display names: participantDisplayName ?? (type === 'team' ? teamName ?? 'Team' : 'Participant').
// Seed is registration.seed ?? 0 (0 = unseeded).

@Injectable()
export class TournamentBracketService {
  constructor(private readonly matchRepository: TournamentMatchRepository) {}

  async getBracket(
    tournamentId: Types.ObjectId,
    format: TournamentFormat,
    participants: TournamentRegistrationDocument[],
  ): Promise<BracketProjectionDto> {
    const { items } = await this.matchRepository.list(tournamentId, { limit: 1000 });

    const displayNameMap = buildDisplayNameMap(participants);
    const seedMap = buildSeedMap(participants);

    const rounds = projectRounds(items, format, displayNameMap, seedMap);

    return {
      tournamentId: String(tournamentId),
      format,
      rounds,
      generatedAt: new Date().toISOString(),
    };
  }
}

// ─── Round projection ─────────────────────────────────────────────────────────

function projectRounds(
  matches: TournamentMatchDocument[],
  format: TournamentFormat,
  displayNameMap: Map<string, string>,
  seedMap: Map<string, number>,
): readonly BracketRoundDto[] {
  if (matches.length === 0) return [];

  // Group by round number.
  const roundMap = new Map<number, TournamentMatchDocument[]>();
  for (const m of matches) {
    const existing = roundMap.get(m.round) ?? [];
    existing.push(m);
    roundMap.set(m.round, existing);
  }

  const roundNumbers = Array.from(roundMap.keys()).sort((a, b) => a - b);
  const maxRound = Math.max(...roundNumbers);

  return roundNumbers.map((round) => {
    const roundMatches = (roundMap.get(round) ?? []).sort((a, b) => a.matchNumber - b.matchNumber);

    const label =
      format === 'single_elimination' ? singleEliminationLabel(round, maxRound) : `Round ${round}`;

    const bracketMatches: BracketMatchNodeDto[] = roundMatches.map((m) => ({
      matchId: String(m._id),
      round: m.round,
      matchNumber: m.matchNumber,
      status: m.status,
      ...(m.participant1Id
        ? {
            participant1: makeParticipantSeed(String(m.participant1Id), displayNameMap, seedMap),
          }
        : {}),
      ...(m.participant2Id
        ? {
            participant2: makeParticipantSeed(String(m.participant2Id), displayNameMap, seedMap),
          }
        : {}),
      ...(m.winnerId ? { winnerId: String(m.winnerId) } : {}),
    }));

    return { round, label, matches: bracketMatches };
  });
}

function makeParticipantSeed(
  participantId: string,
  displayNameMap: Map<string, string>,
  seedMap: Map<string, number>,
): BracketParticipantSeedDto {
  return {
    participantId,
    displayName: displayNameMap.get(participantId) ?? 'Participant',
    seed: seedMap.get(participantId) ?? 0,
  };
}

// ─── Single-elimination round label logic ─────────────────────────────────────
//
// Labels the last rounds by name when total rounds allow named stages.
// round == maxRound       → "Final"
// round == maxRound - 1   → "Semifinal" (only if maxRound >= 2)
// round == maxRound - 2   → "Quarterfinal" (only if maxRound >= 3)
// all others              → "Round N"

function singleEliminationLabel(round: number, maxRound: number): string {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1 && maxRound >= 2) return 'Semifinal';
  if (fromEnd === 2 && maxRound >= 3) return 'Quarterfinal';
  return `Round ${round}`;
}

// ─── Participant data helpers ─────────────────────────────────────────────────

function buildDisplayNameMap(participants: TournamentRegistrationDocument[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of participants) {
    const displayName =
      p.participantDisplayName ?? (p.type === 'team' ? (p.teamName ?? 'Team') : 'Participant');
    map.set(String(p._id), displayName);
  }
  return map;
}

function buildSeedMap(participants: TournamentRegistrationDocument[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of participants) {
    if (p.seed !== undefined) {
      map.set(String(p._id), p.seed);
    }
  }
  return map;
}
