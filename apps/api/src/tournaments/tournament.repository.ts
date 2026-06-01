import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, type TournamentDocument } from './tournament.schema';
import type {
  TournamentId,
  CreateTournamentInput,
  UpdateTournamentInput,
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
    if (filter.status !== undefined) query.status = filter.status;
    if (filter.format !== undefined) query.format = filter.format;
    if (filter.registrationOpen === true) {
      const now = new Date();
      query.registrationOpenAt = { $lte: now };
      query.registrationCloseAt = { $gte: now };
    }
    if (!filter.includeDeleted) query.deletedAt = { $exists: false };

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

  update(id: TournamentId, input: UpdateTournamentInput): Promise<TournamentDocument | null> {
    const set: Record<string, unknown> = {};

    if (input.gameId !== undefined) set.gameId = input.gameId;
    if (input.title !== undefined) set.title = input.title;
    if (input.slug !== undefined) set.slug = input.slug;
    if (input.slugNormalized !== undefined) set.slugNormalized = input.slugNormalized;
    if (input.description !== undefined) set.description = input.description;
    if (input.format !== undefined) set.format = input.format;
    if (input.status !== undefined) set.status = input.status;
    if (input.participantType !== undefined) set.participantType = input.participantType;
    if (input.capacity !== undefined) set.capacity = input.capacity;
    if (input.registrationOpenAt !== undefined) set.registrationOpenAt = input.registrationOpenAt;
    if (input.registrationCloseAt !== undefined)
      set.registrationCloseAt = input.registrationCloseAt;
    if (input.startsAt !== undefined) set.startsAt = input.startsAt;
    if (input.endsAt !== undefined) set.endsAt = input.endsAt;
    if (input.rules !== undefined) set.rules = input.rules;
    if (input.publishedAt !== undefined) set.publishedAt = input.publishedAt;
    if (input.cancelledAt !== undefined) set.cancelledAt = input.cancelledAt;

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
