import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { TournamentRegistrationStatus, TournamentRegistrationType } from '@dragon/types';
import {
  TournamentRegistration,
  type TournamentRegistrationDocument,
} from './tournament-registration.schema';
import type {
  RegistrationId,
  RegistrationTournamentId,
  CreateRegistrationInput,
  RegistrationRepositoryPatch,
  RegistrationListFilter,
} from './tournament-registration.types';
import { CAPACITY_COUNTING_STATUSES } from './tournament-registration-policy';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class TournamentRegistrationRepository {
  constructor(
    @InjectModel(TournamentRegistration.name)
    private readonly model: Model<TournamentRegistrationDocument>,
  ) {}

  findById(id: RegistrationId): Promise<TournamentRegistrationDocument | null> {
    return this.model.findById(id).exec();
  }

  findByTournamentAndUser(
    tournamentId: RegistrationTournamentId,
    userId: string,
  ): Promise<TournamentRegistrationDocument | null> {
    return this.model.findOne({ tournamentId, userId }).sort({ createdAt: -1 }).exec();
  }

  // Returns any registration that would block a new one (submitted/approved/waitlisted/rejected).
  findBlockingRegistration(
    tournamentId: RegistrationTournamentId,
    userId: string,
  ): Promise<TournamentRegistrationDocument | null> {
    const blockingStatuses: TournamentRegistrationStatus[] = [
      'submitted',
      'approved',
      'waitlisted',
      'rejected',
    ];
    return this.model.findOne({ tournamentId, userId, status: { $in: blockingStatuses } }).exec();
  }

  countActive(tournamentId: RegistrationTournamentId): Promise<number> {
    const statuses = [...CAPACITY_COUNTING_STATUSES] as TournamentRegistrationStatus[];
    return this.model.countDocuments({ tournamentId, status: { $in: statuses } }).exec();
  }

  async list(
    filter: RegistrationListFilter,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ): Promise<{ items: TournamentRegistrationDocument[]; total: number }> {
    const query: Record<string, unknown> = {
      tournamentId: filter.tournamentId,
    };

    if (filter.userId !== undefined) query.userId = filter.userId;
    if (filter.status !== undefined) {
      query.status = filter.status;
    }
    if (filter.type !== undefined) {
      query.type = filter.type as TournamentRegistrationType;
    }

    const clampedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(clampedLimit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items: items as TournamentRegistrationDocument[], total };
  }

  async create(input: CreateRegistrationInput): Promise<TournamentRegistrationDocument> {
    const doc: Record<string, unknown> = {
      tournamentId: input.tournamentId,
      userId: input.userId,
      type: input.type,
      status: 'submitted',
      submittedAt: new Date(),
    };

    if (input.teamName !== undefined) doc.teamName = input.teamName;
    if (input.members !== undefined) doc.members = input.members;

    const created = await this.model.create(doc);
    return created as TournamentRegistrationDocument;
  }

  update(
    id: RegistrationId,
    patch: RegistrationRepositoryPatch,
  ): Promise<TournamentRegistrationDocument | null> {
    const set: Record<string, unknown> = {};

    if (patch.status !== undefined) set.status = patch.status;
    if (patch.teamName !== undefined) set.teamName = patch.teamName;
    if (patch.members !== undefined) set.members = patch.members;
    if (patch.approvedAt !== undefined) set.approvedAt = patch.approvedAt;
    if (patch.rejectedAt !== undefined) set.rejectedAt = patch.rejectedAt;
    if (patch.withdrawnAt !== undefined) set.withdrawnAt = patch.withdrawnAt;
    if (patch.cancelledAt !== undefined) set.cancelledAt = patch.cancelledAt;
    if (patch.rejectedReason !== undefined) set.rejectedReason = patch.rejectedReason;
    if (patch.participantDisplayName !== undefined)
      set.participantDisplayName = patch.participantDisplayName;
    if (patch.seed !== undefined) set.seed = patch.seed;
    if (patch.participantRemovedAt !== undefined)
      set.participantRemovedAt = patch.participantRemovedAt;
    if (patch.participantDisqualifiedAt !== undefined)
      set.participantDisqualifiedAt = patch.participantDisqualifiedAt;

    return this.model.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }
}
