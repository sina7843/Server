import { Injectable, Optional } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditAction } from '@dragon/types';
import type {
  TournamentFormat,
  TournamentStandingsDto,
  TournamentStandingDto,
  RecalculateStandingsResultDto,
} from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { TournamentMatchRepository } from '../tournament-matches/tournament-match.repository';
import type { TournamentMatchDocument } from '../tournament-matches/tournament-match.schema';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Standings policy ─────────────────────────────────────────────────────────
//
// Standings are a read-only projection computed from completed TournamentMatch records.
// No permanent standings collection is created — computation is on-demand.
//
// round_robin:
//   Each completed match contributes +1 win and +1 loss to participants.
//   Points = wins * 3 (standard round-robin convention).
//   Ranked by: points desc, wins desc, losses asc.
//
// single_elimination:
//   Wins represent rounds advanced. Points = wins * 1 (simple advancement metric).
//   Ranked by: wins desc (progress), losses asc (no multi-loss in SE).
//
// manual:
//   No calculable standings from match records alone.
//   Returns empty standings with format='manual'.
//
// Result fields: participant IDs in matches are registration ObjectId references.
// Display names are derived from registration.participantDisplayName ?? registration.userId.

@Injectable()
export class TournamentStandingsService {
  constructor(
    private readonly matchRepository: TournamentMatchRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async getStandings(
    tournamentId: Types.ObjectId,
    format: TournamentFormat,
    participants: TournamentRegistrationDocument[],
  ): Promise<TournamentStandingsDto> {
    if (format === 'manual') {
      return {
        tournamentId: String(tournamentId),
        format,
        standings: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const allMatches = await this.loadAllCompletedMatches(tournamentId);
    const standing = this.computeStandings(format, allMatches, participants);

    return {
      tournamentId: String(tournamentId),
      format,
      standings: standing,
      updatedAt: new Date().toISOString(),
    };
  }

  async recalculate(
    tournamentId: Types.ObjectId,
    format: TournamentFormat,
    participants: TournamentRegistrationDocument[],
    adminUserId: string,
  ): Promise<RecalculateStandingsResultDto> {
    const recalculatedAt = new Date().toISOString();

    // Re-computation is pure projection — no persistent write needed.
    // If format is manual, standing is empty but recalculation still succeeds.
    if (format !== 'manual') {
      const allMatches = await this.loadAllCompletedMatches(tournamentId);
      // compute to validate no errors occur, result discarded (pure projection)
      this.computeStandings(format, allMatches, participants);
    }

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.STANDINGS_RECALCULATED,
      resourceType: 'tournament',
      resourceId: String(tournamentId),
      after: { format, recalculatedAt },
    });

    return {
      success: true,
      tournamentId: String(tournamentId),
      recalculatedAt,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async loadAllCompletedMatches(
    tournamentId: Types.ObjectId,
  ): Promise<TournamentMatchDocument[]> {
    const { items } = await this.matchRepository.list(tournamentId, {
      status: 'completed',
      limit: 1000,
    });
    return items;
  }

  private computeStandings(
    format: TournamentFormat,
    matches: TournamentMatchDocument[],
    participants: TournamentRegistrationDocument[],
  ): readonly TournamentStandingDto[] {
    const displayNameMap = buildDisplayNameMap(participants);

    type Tally = { wins: number; losses: number };
    const tally = new Map<string, Tally>();

    // Seed all participants with zero wins/losses.
    for (const p of participants) {
      tally.set(String(p._id), { wins: 0, losses: 0 });
    }

    for (const match of matches) {
      if (!match.winnerId || !match.participant1Id || !match.participant2Id) continue;

      const winnerId = String(match.winnerId);
      const p1Id = String(match.participant1Id);
      const p2Id = String(match.participant2Id);
      const loserId = winnerId === p1Id ? p2Id : p1Id;

      const winnerTally = tally.get(winnerId) ?? { wins: 0, losses: 0 };
      const loserTally = tally.get(loserId) ?? { wins: 0, losses: 0 };

      tally.set(winnerId, { wins: winnerTally.wins + 1, losses: winnerTally.losses });
      tally.set(loserId, { wins: loserTally.wins, losses: loserTally.losses + 1 });
    }

    const pointMultiplier = format === 'round_robin' ? 3 : 1;

    const entries = Array.from(tally.entries()).map(([participantId, t]) => ({
      participantId,
      displayName: displayNameMap.get(participantId) ?? 'Participant',
      wins: t.wins,
      losses: t.losses,
      points: t.wins * pointMultiplier,
    }));

    // Sort: points desc, wins desc, losses asc, then participantId for determinism.
    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.participantId.localeCompare(b.participantId);
    });

    return entries.map((e, idx) => ({ rank: idx + 1, ...e }));
  }
}

function buildDisplayNameMap(participants: TournamentRegistrationDocument[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of participants) {
    const displayName =
      p.participantDisplayName ?? (p.type === 'team' ? (p.teamName ?? 'Team') : 'Participant');
    map.set(String(p._id), displayName);
  }
  return map;
}
