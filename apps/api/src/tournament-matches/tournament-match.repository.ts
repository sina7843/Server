import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TournamentMatch, type TournamentMatchDocument } from './tournament-match.schema';
import type {
  CreateMatchInput,
  MatchListFilter,
  MatchRepositoryPatch,
} from './tournament-match.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class TournamentMatchRepository {
  constructor(
    @InjectModel(TournamentMatch.name)
    private readonly model: Model<TournamentMatchDocument>,
  ) {}

  async list(
    tournamentId: Types.ObjectId,
    filter: MatchListFilter = {},
  ): Promise<{ items: TournamentMatchDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filter.page ?? DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, filter.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { tournamentId };
    if (filter.round !== undefined) query.round = filter.round;
    if (filter.status !== undefined) query.status = filter.status;

    const [items, total] = await Promise.all([
      this.model.find(query).sort({ round: 1, matchNumber: 1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items: items as TournamentMatchDocument[], total, page, limit };
  }

  async findById(matchId: string): Promise<TournamentMatchDocument | null> {
    if (!Types.ObjectId.isValid(matchId)) return null;
    return (await this.model.findById(matchId).exec()) as TournamentMatchDocument | null;
  }

  async create(
    tournamentId: Types.ObjectId,
    input: CreateMatchInput,
  ): Promise<TournamentMatchDocument> {
    const doc = new this.model({
      tournamentId,
      round: input.round,
      matchNumber: input.matchNumber,
      participant1Id: input.participant1Id,
      participant2Id: input.participant2Id,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
    });
    return (await doc.save()) as TournamentMatchDocument;
  }

  async createMany(
    tournamentId: Types.ObjectId,
    inputs: CreateMatchInput[],
    generatedAt: Date,
  ): Promise<TournamentMatchDocument[]> {
    const docs = inputs.map((input) => ({
      tournamentId,
      round: input.round,
      matchNumber: input.matchNumber,
      participant1Id: input.participant1Id,
      participant2Id: input.participant2Id,
      scheduledAt: input.scheduledAt,
      status: 'scheduled' as const,
      generatedAt,
    }));

    const inserted = await this.model.insertMany(docs);
    return inserted as unknown as TournamentMatchDocument[];
  }

  async patch(
    matchId: string,
    patch: MatchRepositoryPatch,
  ): Promise<TournamentMatchDocument | null> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, unknown> = {};

    if ('participant1Id' in patch) {
      if (patch.participant1Id === null) unset.participant1Id = '';
      else if (patch.participant1Id !== undefined) set.participant1Id = patch.participant1Id;
    }
    if ('participant2Id' in patch) {
      if (patch.participant2Id === null) unset.participant2Id = '';
      else if (patch.participant2Id !== undefined) set.participant2Id = patch.participant2Id;
    }
    if ('scheduledAt' in patch) {
      if (patch.scheduledAt === null) unset.scheduledAt = '';
      else if (patch.scheduledAt !== undefined) set.scheduledAt = patch.scheduledAt;
    }
    if (patch.notes !== undefined) set.notes = patch.notes;
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.completedAt !== undefined) {
      if (patch.completedAt === null) unset.completedAt = '';
      else set.completedAt = patch.completedAt;
    }
    if ('winnerId' in patch) {
      if (patch.winnerId === null) unset.winnerId = '';
      else if (patch.winnerId !== undefined) set.winnerId = patch.winnerId;
    }
    if ('participant1Score' in patch) {
      if (patch.participant1Score === null) unset.participant1Score = '';
      else if (patch.participant1Score !== undefined)
        set.participant1Score = patch.participant1Score;
    }
    if ('participant2Score' in patch) {
      if (patch.participant2Score === null) unset.participant2Score = '';
      else if (patch.participant2Score !== undefined)
        set.participant2Score = patch.participant2Score;
    }
    if ('resultNotes' in patch) {
      if (patch.resultNotes === null) unset.resultNotes = '';
      else if (patch.resultNotes !== undefined) set.resultNotes = patch.resultNotes;
    }
    if ('resultRecordedAt' in patch) {
      if (patch.resultRecordedAt === null) unset.resultRecordedAt = '';
      else if (patch.resultRecordedAt !== undefined) set.resultRecordedAt = patch.resultRecordedAt;
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    if (!Object.keys(update).length) {
      return this.findById(matchId);
    }

    return (await this.model
      .findByIdAndUpdate(matchId, update, { new: true })
      .exec()) as TournamentMatchDocument | null;
  }

  async countByTournament(tournamentId: Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ tournamentId }).exec();
  }
}
