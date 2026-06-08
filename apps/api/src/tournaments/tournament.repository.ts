import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, type TournamentDocument } from './tournament.schema';
import type {
  TournamentId,
  CreateTournamentInput,
  TournamentRepositoryPatch,
  TournamentListFilter,
} from './tournament.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class TournamentRepository {
  constructor(
    @InjectModel(Tournament.name)
    private readonly tournamentModel: Model<TournamentDocument>,
  ) {}

  findById(id: TournamentId): Promise<TournamentDocument | null> {
    return this.tournamentModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
  }

  findBySlug(slugNormalized: string): Promise<TournamentDocument | null> {
    return this.tournamentModel.findOne({ slugNormalized, deletedAt: { $exists: false } }).exec();
  }

  existsBySlug(
    slugNormalized: string,
    excludeId?: TournamentId,
  ): Promise<TournamentDocument | null> {
    const filter: Record<string, unknown> = { slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.tournamentModel.findOne(filter).exec();
  }

  async list(
    filter: TournamentListFilter,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ): Promise<{ items: TournamentDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.gameId !== undefined) query.gameId = filter.gameId;
    if (filter.format !== undefined) query.format = filter.format;

    // Status precedence: registrationOpen=true > explicit status > statuses array
    if (filter.registrationOpen === true) {
      // Primary: status must be registration_open (status-primary policy).
      // Window check: if fields exist they must be active; absent fields = status-only fallback.
      const now = new Date();
      query.status = 'registration_open';
      query.$and = [
        {
          $or: [{ registrationOpenAt: { $exists: false } }, { registrationOpenAt: { $lte: now } }],
        },
        {
          $or: [
            { registrationCloseAt: { $exists: false } },
            { registrationCloseAt: { $gte: now } },
          ],
        },
      ];
    } else if (filter.registrationOpen === false) {
      const now = new Date();
      if (filter.status !== undefined) {
        query.status = filter.status;
      } else if (filter.statuses !== undefined && filter.statuses.length > 0) {
        query.status = { $in: filter.statuses };
      }
      query.$or = [
        { status: { $ne: 'registration_open' } },
        { registrationOpenAt: { $gt: now } },
        { registrationCloseAt: { $lt: now } },
      ];
    } else if (filter.status !== undefined) {
      query.status = filter.status;
    } else if (filter.statuses !== undefined && filter.statuses.length > 0) {
      query.status = { $in: filter.statuses };
    }

    if (!filter.includeDeleted) query.deletedAt = { $exists: false };
    if (!filter.includeArchived) query.archivedAt = { $exists: false };

    if (filter.titleSearch !== undefined && filter.titleSearch.length > 0) {
      // Escape regex metacharacters before constructing the pattern.
      const escaped = filter.titleSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escaped, $options: 'i' };
    }

    const clampedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [items, total] = await Promise.all([
      this.tournamentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(clampedLimit)
        .exec(),
      this.tournamentModel.countDocuments(query).exec(),
    ]);

    return { items: items as TournamentDocument[], total };
  }

  async create(input: CreateTournamentInput): Promise<TournamentDocument> {
    const doc: Record<string, unknown> = {
      gameId: input.gameId,
      title: input.title,
      slug: input.slug,
      slugNormalized: input.slugNormalized ?? input.slug,
      format: input.format,
      status: input.status ?? 'draft',
      participantType: input.participantType ?? 'individual',
      capacity: input.capacity,
    };

    if (input.description !== undefined) doc.description = input.description;
    if (input.registrationOpenAt !== undefined) doc.registrationOpenAt = input.registrationOpenAt;
    if (input.registrationCloseAt !== undefined)
      doc.registrationCloseAt = input.registrationCloseAt;
    if (input.startsAt !== undefined) doc.startsAt = input.startsAt;
    if (input.endsAt !== undefined) doc.endsAt = input.endsAt;
    if (input.rules !== undefined) doc.rules = input.rules;

    const created = await this.tournamentModel.create(doc);
    return created as TournamentDocument;
  }

  update(id: TournamentId, patch: TournamentRepositoryPatch): Promise<TournamentDocument | null> {
    const set: Record<string, unknown> = {};

    if (patch.gameId !== undefined) set.gameId = patch.gameId;
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.slug !== undefined) set.slug = patch.slug;
    if (patch.slugNormalized !== undefined) set.slugNormalized = patch.slugNormalized;
    if (patch.description !== undefined) set.description = patch.description;
    if (patch.format !== undefined) set.format = patch.format;
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.participantType !== undefined) set.participantType = patch.participantType;
    if (patch.capacity !== undefined) set.capacity = patch.capacity;
    if (patch.registrationOpenAt !== undefined) set.registrationOpenAt = patch.registrationOpenAt;
    if (patch.registrationCloseAt !== undefined)
      set.registrationCloseAt = patch.registrationCloseAt;
    if (patch.startsAt !== undefined) set.startsAt = patch.startsAt;
    if (patch.endsAt !== undefined) set.endsAt = patch.endsAt;
    if (patch.rules !== undefined) set.rules = patch.rules;
    if (patch.publishedAt !== undefined) set.publishedAt = patch.publishedAt;
    if (patch.cancelledAt !== undefined) set.cancelledAt = patch.cancelledAt;
    if (patch.archivedAt !== undefined) set.archivedAt = patch.archivedAt;

    return this.tournamentModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: set }, { new: true })
      .exec();
  }

  softDelete(id: TournamentId): Promise<TournamentDocument | null> {
    return this.tournamentModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
