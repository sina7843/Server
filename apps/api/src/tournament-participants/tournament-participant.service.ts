import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditAction } from '@dragon/types';
import type { ParticipantStatus } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import {
  TournamentRegistration,
  type TournamentRegistrationDocument,
} from '../tournament-registrations/tournament-registration.schema';
import {
  assertParticipantIsActive,
  isRegistrationAParticipant,
} from './tournament-participant-policy';

// ─── Service ──────────────────────────────────────────────────────────────────
//
// Participants are derived projections from approved registrations.
// No separate TournamentParticipant collection exists.
//
// participantId == registrationId (same MongoDB ObjectId).
//
// Sync behavior:
//   Registration approved → participant becomes 'active' (query-time derivation,
//   no explicit sync needed).
//   User withdraws approved registration → participant becomes 'withdrawn'
//   (derived from registration.status === 'withdrawn' + approvedAt set).
//   Admin removes participant → sets participantRemovedAt on registration.
//   Admin disqualifies participant → sets participantDisqualifiedAt on registration.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class TournamentParticipantService {
  constructor(
    @InjectModel(TournamentRegistration.name)
    private readonly registrationModel: Model<TournamentRegistrationDocument>,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  // ─── List participants ─────────────────────────────────────────────────────
  //
  // Returns only registrations that represent participants:
  //   - status === 'approved' (active, removed, or disqualified)
  //   - status === 'withdrawn' + approvedAt set (was approved, user withdrew)
  //
  // Non-approved (submitted/rejected/waitlisted/cancelled) never-approved
  // registrations are excluded.

  async listParticipants(
    tournamentId: string | Types.ObjectId,
    status?: ParticipantStatus,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ): Promise<{ items: TournamentRegistrationDocument[]; total: number }> {
    const query = this.buildListQuery(tournamentId, status);
    const clampedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [items, total] = await Promise.all([
      this.registrationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(clampedLimit)
        .exec(),
      this.registrationModel.countDocuments(query).exec(),
    ]);

    return { items: items as TournamentRegistrationDocument[], total };
  }

  // ─── Find single participant ───────────────────────────────────────────────

  async findParticipant(
    participantId: string,
    tournamentId: string,
  ): Promise<TournamentRegistrationDocument | null> {
    const doc = await this.registrationModel.findById(participantId).exec();
    if (!doc) return null;
    if (String(doc.tournamentId) !== tournamentId) return null;
    if (!isRegistrationAParticipant(doc)) return null;
    return doc as TournamentRegistrationDocument;
  }

  // ─── Admin: update participant (PATCH) ────────────────────────────────────
  //
  // Accepts seed and displayName only.
  // Status cannot be changed via PATCH — enforced by assertParticipantIsActive.

  async updateParticipant(
    participantId: string,
    tournamentId: string,
    input: { seed?: number; displayName?: string },
  ): Promise<TournamentRegistrationDocument> {
    const doc = await this.requireActiveParticipant(participantId, tournamentId);
    void doc; // already validated ownership and active status

    const set: Record<string, unknown> = {};
    if (input.seed !== undefined) set.seed = input.seed;
    if (input.displayName !== undefined) set.participantDisplayName = input.displayName;

    const updated = await this.registrationModel
      .findByIdAndUpdate(participantId, { $set: set }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Participant not found.');
    return updated as TournamentRegistrationDocument;
  }

  // ─── Admin: remove participant ────────────────────────────────────────────

  async removeParticipant(
    participantId: string,
    tournamentId: string,
    adminUserId: string,
  ): Promise<void> {
    await this.requireActiveParticipant(participantId, tournamentId);

    await this.registrationModel
      .findByIdAndUpdate(participantId, { $set: { participantRemovedAt: new Date() } })
      .exec();

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.PARTICIPANT_REMOVED,
      resourceType: 'tournament_participant',
      resourceId: participantId,
      after: { tournamentId, status: 'removed' },
      severity: 'warning',
    });
  }

  // ─── Admin: disqualify participant ────────────────────────────────────────

  async disqualifyParticipant(
    participantId: string,
    tournamentId: string,
    adminUserId: string,
  ): Promise<TournamentRegistrationDocument> {
    await this.requireActiveParticipant(participantId, tournamentId);

    const updated = await this.registrationModel
      .findByIdAndUpdate(
        participantId,
        { $set: { participantDisqualifiedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException('Participant not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.PARTICIPANT_DISQUALIFIED,
      resourceType: 'tournament_participant',
      resourceId: participantId,
      after: { tournamentId, status: 'disqualified' },
      severity: 'warning',
    });

    return updated as TournamentRegistrationDocument;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async requireActiveParticipant(
    participantId: string,
    tournamentId: string,
  ): Promise<TournamentRegistrationDocument> {
    const doc = await this.findParticipant(participantId, tournamentId);
    if (!doc) throw new NotFoundException('Participant not found.');
    assertParticipantIsActive(doc);
    return doc;
  }

  private buildListQuery(
    tournamentId: string | Types.ObjectId,
    status?: ParticipantStatus,
  ): Record<string, unknown> {
    const base = { tournamentId };

    if (status === 'active') {
      return {
        ...base,
        status: 'approved',
        participantRemovedAt: { $exists: false },
        participantDisqualifiedAt: { $exists: false },
      };
    }
    if (status === 'removed') {
      return { ...base, participantRemovedAt: { $exists: true, $ne: null } };
    }
    if (status === 'disqualified') {
      return { ...base, participantDisqualifiedAt: { $exists: true, $ne: null } };
    }
    if (status === 'withdrawn') {
      return { ...base, status: 'withdrawn', approvedAt: { $exists: true, $ne: null } };
    }

    // No filter — all participant-eligible registrations.
    return {
      ...base,
      $or: [
        { status: 'approved' },
        { status: 'withdrawn', approvedAt: { $exists: true, $ne: null } },
      ],
    };
  }
}
