import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditAction, AUDIT_RESOURCE_TYPES } from '@dragon/types';
import type { TournamentFormat, TournamentStatus } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { TournamentMatchRepository } from './tournament-match.repository';
import type { TournamentMatchDocument } from './tournament-match.schema';
import type { CreateMatchInput, MatchListFilter, UpdateMatchInput } from './tournament-match.types';
import {
  assertMatchIsCancellable,
  assertMatchIsUpdatable,
  assertTournamentAllowsGeneration,
} from './tournament-match-policy';
import {
  generateSingleEliminationRound1,
  generateRoundRobin,
  isPowerOfTwo,
} from './tournament-match-generation';

@Injectable()
export class TournamentMatchService {
  constructor(
    private readonly matchRepository: TournamentMatchRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async listMatches(
    tournamentId: Types.ObjectId,
    filter: MatchListFilter = {},
  ): Promise<{ items: TournamentMatchDocument[]; total: number; page: number; limit: number }> {
    return this.matchRepository.list(tournamentId, filter);
  }

  // ─── Find one ─────────────────────────────────────────────────────────────

  async findById(matchId: string, tournamentId: Types.ObjectId): Promise<TournamentMatchDocument> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new NotFoundException('Match not found.');
    if (String(match.tournamentId) !== String(tournamentId)) {
      throw new NotFoundException('Match not found.');
    }
    return match;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async createMatch(
    tournamentId: Types.ObjectId,
    input: CreateMatchInput,
    adminUserId: string,
  ): Promise<TournamentMatchDocument> {
    const match = await this.matchRepository.create(tournamentId, input);

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.MATCH_CREATED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_MATCH,
      resourceId: String(match._id),
      after: {
        tournamentId: String(tournamentId),
        round: input.round,
        matchNumber: input.matchNumber,
      },
      severity: 'info',
    });

    return match;
  }

  // ─── Generate ─────────────────────────────────────────────────────────────

  async generateMatches(
    tournamentId: Types.ObjectId,
    tournamentStatus: TournamentStatus,
    tournamentFormat: TournamentFormat,
    participantIds: Types.ObjectId[],
    adminUserId: string,
  ): Promise<TournamentMatchDocument[]> {
    assertTournamentAllowsGeneration(tournamentStatus, tournamentFormat);

    if (participantIds.length < 2) {
      throw new BadRequestException(
        'At least 2 active participants are required to generate matches.',
      );
    }

    if (tournamentFormat === 'single_elimination' && !isPowerOfTwo(participantIds.length)) {
      throw new BadRequestException(
        `single_elimination generation requires a power-of-two participant count (2, 4, 8, 16, …). ` +
          `Got ${participantIds.length}. Use manual match creation for non-power-of-two participant counts.`,
      );
    }

    const existing = await this.matchRepository.countByTournament(tournamentId);
    if (existing > 0) {
      throw new ConflictException(
        'Matches already exist for this tournament. Delete existing matches before generating.',
      );
    }

    let inputs: CreateMatchInput[];
    if (tournamentFormat === 'single_elimination') {
      inputs = generateSingleEliminationRound1(participantIds);
    } else {
      inputs = generateRoundRobin(participantIds);
    }

    const generatedAt = new Date();
    const matches = await this.matchRepository.createMany(tournamentId, inputs, generatedAt);

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.MATCH_GENERATED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_MATCH,
      resourceId: String(tournamentId),
      after: {
        tournamentId: String(tournamentId),
        format: tournamentFormat,
        count: matches.length,
      },
      severity: 'info',
    });

    return matches;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async updateMatch(
    matchId: string,
    tournamentId: Types.ObjectId,
    input: UpdateMatchInput,
    adminUserId: string,
  ): Promise<TournamentMatchDocument> {
    const existing = await this.findById(matchId, tournamentId);
    assertMatchIsUpdatable(existing);

    const patch = { ...input };
    const updated = await this.matchRepository.patch(matchId, patch);
    if (!updated) throw new NotFoundException('Match not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.MATCH_UPDATED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_MATCH,
      resourceId: matchId,
      after: { tournamentId: String(tournamentId), ...input },
      severity: 'info',
    });

    return updated;
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  async cancelMatch(
    matchId: string,
    tournamentId: Types.ObjectId,
    adminUserId: string,
  ): Promise<TournamentMatchDocument> {
    const existing = await this.findById(matchId, tournamentId);
    assertMatchIsCancellable(existing);

    const updated = await this.matchRepository.patch(matchId, { status: 'cancelled' });
    if (!updated) throw new NotFoundException('Match not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.MATCH_CANCELLED,
      resourceType: AUDIT_RESOURCE_TYPES.TOURNAMENT_MATCH,
      resourceId: matchId,
      after: { tournamentId: String(tournamentId), status: 'cancelled' },
      severity: 'warning',
    });

    return updated;
  }
}
