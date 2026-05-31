import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { normalizeSlug, SlugPolicyError } from '../content/slug/slug-policy';
import { GameRepository } from './game.repository';
import type { GameDocument } from './game.schema';
import type { GameId, CreateGameInput, UpdateGameInput, GameListFilter } from './game.types';

@Injectable()
export class GameService {
  constructor(private readonly gameRepository: GameRepository) {}

  findById(id: GameId): Promise<GameDocument | null> {
    return this.gameRepository.findById(id);
  }

  list(
    filter: GameListFilter,
    page?: number,
    limit?: number,
  ): Promise<{ items: GameDocument[]; total: number }> {
    return this.gameRepository.list(filter, page, limit);
  }

  async create(input: CreateGameInput): Promise<GameDocument> {
    let slugNormalized: string;

    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    const taken = await this.gameRepository.existsBySlug(slugNormalized);
    if (taken) {
      throw new ConflictException(`Game slug "${input.slug}" is already taken.`);
    }

    return this.gameRepository.create({ ...input, slugNormalized });
  }

  async update(id: GameId, input: UpdateGameInput): Promise<GameDocument> {
    let slugNormalized: string | undefined;

    if (input.slug !== undefined) {
      try {
        slugNormalized = normalizeSlug(input.slug);
      } catch (err) {
        if (err instanceof SlugPolicyError) {
          throw new ConflictException(err.message);
        }
        throw err;
      }

      const taken = await this.gameRepository.existsBySlug(slugNormalized, id);
      if (taken) {
        throw new ConflictException(`Game slug "${input.slug}" is already taken.`);
      }
    }

    const updated = await this.gameRepository.update(id, {
      ...input,
      ...(slugNormalized !== undefined ? { slugNormalized } : {}),
    });

    if (!updated) throw new NotFoundException('Game not found.');
    return updated;
  }

  async softDelete(id: GameId): Promise<GameDocument> {
    const updated = await this.gameRepository.softDelete(id);
    if (!updated) throw new NotFoundException('Game not found.');
    return updated;
  }
}
