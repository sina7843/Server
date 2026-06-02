import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditAction, AUDIT_RESOURCE_TYPES } from '@dragon/types';
import type { TournamentMatchResultDto, TournamentStatus } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { TournamentMatchRepository } from './tournament-match.repository';
import type { TournamentMatchDocument } from './tournament-match.schema';
import {
  assertTournamentAllowsResult,
  assertMatchIsRecordable,
  assertMatchHasResult,
  assertBothParticipantsPresent,
  assertWinnerIsParticipant,
} from './tournament-result-policy';
import { toResultDto } from './tournament-result-projection';
import type { ParsedCreateResult, ParsedUpdateResult } from './dto/result-body';

@Injectable()
export class TournamentResultService {
  constructor(
    private readonly matchRepository: TournamentMatchRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  // ─── Record result ────────────────────────────────────────────────────────
  //
  // Preconditions:
  //   - Tournament must be in_progress.
  //   - Match must be in scheduled or in_progress (not completed or cancelled).
  //   - Both participants must be set on the match.
  //   - Winner must be participant1Id or participant2Id.
  //
  // Side effects on match:
  //   - status → completed
  //   - winnerId → input.winnerId
  //   - completedAt → now
  //   - resultRecordedAt → now
  //   - participant1Score / participant2Score / resultNotes set if provided

  async record(
    matchId: string,
    tournamentId: Types.ObjectId,
    tournamentStatus: TournamentStatus,
    input: ParsedCreateResult,
    adminUserId: string,
  ): Promise<TournamentMatchResultDto> {
    assertTournamentAllowsResult(tournamentStatus);

    const match = await this.requireMatch(matchId, tournamentId);
    assertMatchIsRecordable(match);
    assertBothParticipantsPresent(match);
    assertWinnerIsParticipant(input.winnerId, match);

    const now = new Date();
    const updated = await this.matchRepository.patch(matchId, {
      status: 'completed',
      winnerId: input.winnerId,
      completedAt: now,
      resultRecordedAt: now,
      ...(input.participant1Score !== undefined && {
        participant1Score: input.participant1Score,
      }),
      ...(input.participant2Score !== undefined && {
        participant2Score: input.participant2Score,
      }),
      ...(input.notes !== undefined && { resultNotes: input.notes }),
    });

    if (!updated) throw new NotFoundException('Match not found after update.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.RESULT_RECORDED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_RESULT,
      resourceId: matchId,
      after: {
        tournamentId: String(tournamentId),
        matchId,
        winnerId: String(input.winnerId),
      },
      severity: 'info',
    });

    return toResultDto(updated);
  }

  // ─── Update result ────────────────────────────────────────────────────────
  //
  // Preconditions:
  //   - Tournament must be in_progress.
  //   - Match must be in completed (has an existing result).
  //   - Winner must be participant1Id or participant2Id.
  //
  // Side effects on match:
  //   - winnerId → input.winnerId (may change)
  //   - participant1Score / participant2Score / resultNotes updated if provided
  //   - resultRecordedAt is NOT updated (preserves original record timestamp)
  //   - status remains completed

  async update(
    matchId: string,
    tournamentId: Types.ObjectId,
    tournamentStatus: TournamentStatus,
    input: ParsedUpdateResult,
    adminUserId: string,
  ): Promise<TournamentMatchResultDto> {
    assertTournamentAllowsResult(tournamentStatus);

    const match = await this.requireMatch(matchId, tournamentId);
    assertMatchHasResult(match);
    assertBothParticipantsPresent(match);
    assertWinnerIsParticipant(input.winnerId, match);

    const updated = await this.matchRepository.patch(matchId, {
      winnerId: input.winnerId,
      ...(input.participant1Score !== undefined && {
        participant1Score: input.participant1Score,
      }),
      ...(input.participant2Score !== undefined && {
        participant2Score: input.participant2Score,
      }),
      ...(input.notes !== undefined && { resultNotes: input.notes }),
    });

    if (!updated) throw new NotFoundException('Match not found after update.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.RESULT_UPDATED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_RESULT,
      resourceId: matchId,
      after: {
        tournamentId: String(tournamentId),
        matchId,
        winnerId: String(input.winnerId),
      },
      severity: 'info',
    });

    return toResultDto(updated);
  }

  // ─── Void result ──────────────────────────────────────────────────────────
  //
  // Preconditions:
  //   - Tournament must be in_progress.
  //   - Match must be in completed (has a result to void).
  //
  // Side effects on match (void policy):
  //   - status → scheduled (match becomes available for re-recording)
  //   - winnerId cleared
  //   - completedAt cleared
  //   - participant1Score / participant2Score cleared
  //   - resultNotes cleared
  //   - resultRecordedAt cleared

  async void(
    matchId: string,
    tournamentId: Types.ObjectId,
    tournamentStatus: TournamentStatus,
    adminUserId: string,
  ): Promise<void> {
    assertTournamentAllowsResult(tournamentStatus);

    const match = await this.requireMatch(matchId, tournamentId);
    assertMatchHasResult(match);

    await this.matchRepository.patch(matchId, {
      status: 'scheduled',
      winnerId: null,
      completedAt: null,
      participant1Score: null,
      participant2Score: null,
      resultNotes: null,
      resultRecordedAt: null,
    });

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.RESULT_VOIDED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_RESULT,
      resourceId: matchId,
      after: {
        tournamentId: String(tournamentId),
        matchId,
        status: 'scheduled',
      },
      severity: 'warning',
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async requireMatch(
    matchId: string,
    tournamentId: Types.ObjectId,
  ): Promise<TournamentMatchDocument> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new NotFoundException('Match not found.');
    if (String(match.tournamentId) !== String(tournamentId)) {
      throw new NotFoundException('Match not found.');
    }
    return match;
  }
}
