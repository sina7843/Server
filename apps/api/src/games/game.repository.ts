import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, type GameDocument } from './game.schema';
import type { GameId, CreateGameInput, UpdateGameInput, GameListFilter } from './game.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class GameRepository {
  constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

  findById(id: GameId): Promise<GameDocument | null> {
    return this.gameModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
  }

  findBySlug(slugNormalized: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ slugNormalized, deletedAt: { $exists: false } }).exec();
  }

  existsBySlug(slugNormalized: string, excludeId?: GameId): Promise<GameDocument | null> {
    const filter: Record<string, unknown> = { slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.gameModel.findOne(filter).exec();
  }

  async list(
    filter: GameListFilter,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ): Promise<{ items: GameDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.status !== undefined) query.status = filter.status;
    if (!filter.includeDeleted) query.deletedAt = { $exists: false };

    const clampedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (Math.max(1, page) - 1) * clampedLimit;

    const [items, total] = await Promise.all([
      this.gameModel.find(query).sort({ name: 1 }).skip(skip).limit(clampedLimit).exec(),
      this.gameModel.countDocuments(query).exec(),
    ]);

    return { items: items as GameDocument[], total };
  }

  async create(input: CreateGameInput): Promise<GameDocument> {
    const doc: Record<string, unknown> = {
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slugNormalized ?? input.slug,
      status: input.status ?? 'active',
    };

    if (input.description !== undefined) doc.description = input.description;
    if (input.coverMediaId !== undefined) doc.coverMediaId = input.coverMediaId;
    if (input.iconMediaId !== undefined) doc.iconMediaId = input.iconMediaId;

    const created = await this.gameModel.create(doc);
    return created as GameDocument;
  }

  update(id: GameId, input: UpdateGameInput): Promise<GameDocument | null> {
    const set: Record<string, unknown> = {};

    if (input.name !== undefined) set.name = input.name;
    if (input.slug !== undefined) set.slug = input.slug;
    if (input.slugNormalized !== undefined) set.slugNormalized = input.slugNormalized;
    if (input.description !== undefined) set.description = input.description;
    if (input.status !== undefined) set.status = input.status;
    if (input.coverMediaId !== undefined) set.coverMediaId = input.coverMediaId;
    if (input.iconMediaId !== undefined) set.iconMediaId = input.iconMediaId;

    return this.gameModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: set }, { new: true })
      .exec();
  }

  softDelete(id: GameId): Promise<GameDocument | null> {
    return this.gameModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
