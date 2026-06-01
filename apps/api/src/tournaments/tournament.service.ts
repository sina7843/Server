import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TournamentStatus } from '@dragon/types';
import { normalizeSlug, SlugPolicyError } from '../content/slug/slug-policy';
import { GameService } from '../games/game.service';
import { assertTransition } from './tournament-policy';
import { assertRegistrationWindow, assertTournamentSchedule } from './tournament-validation';
import { TournamentRepository } from './tournament.repository';
import type { TournamentDocument } from './tournament.schema';
import type {
  TournamentId,
  CreateTournamentInput,
  UpdateTournamentInput,
  TournamentListFilter,
} from './tournament.types';

@Injectable()
export class TournamentService {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly gameService: GameService,
  ) {}

  findById(id: TournamentId): Promise<TournamentDocument | null> {
    return this.tournamentRepository.findById(id);
  }

  list(
    filter: TournamentListFilter,
    page?: number,
    limit?: number,
  ): Promise<{ items: TournamentDocument[]; total: number }> {
    return this.tournamentRepository.list(filter, page, limit);
  }

  async create(input: CreateTournamentInput): Promise<TournamentDocument> {
    await this.assertGameAvailable(input.gameId);

    assertRegistrationWindow(input.registrationOpenAt, input.registrationCloseAt);
    assertTournamentSchedule(input.startsAt, input.endsAt);

    const slugNormalized = this.normalizeSlugOrThrow(input.slug);
    const taken = await this.tournamentRepository.existsBySlug(slugNormalized);
    if (taken) {
      throw new ConflictException(`Tournament slug "${input.slug}" is already taken.`);
    }

    return this.tournamentRepository.create({ ...input, slugNormalized });
  }

  async update(id: TournamentId, input: UpdateTournamentInput): Promise<TournamentDocument> {
    if (input.gameId !== undefined) {
      await this.assertGameAvailable(input.gameId);
    }

    assertRegistrationWindow(input.registrationOpenAt, input.registrationCloseAt);
    assertTournamentSchedule(input.startsAt, input.endsAt);

    let slugNormalized: string | undefined;

    if (input.slug !== undefined) {
      slugNormalized = this.normalizeSlugOrThrow(input.slug);
      const taken = await this.tournamentRepository.existsBySlug(slugNormalized, id);
      if (taken) {
        throw new ConflictException(`Tournament slug "${input.slug}" is already taken.`);
      }
    }

    const updated = await this.tournamentRepository.update(id, {
      ...input,
      ...(slugNormalized !== undefined ? { slugNormalized } : {}),
    });

    if (!updated) throw new NotFoundException('Tournament not found.');
    return updated;
  }

  // Lifecycle transition — validates the from→to edge, sets lifecycle-managed
  // timestamps, and persists the new status. Audit emission is deferred to Slice 5
  // (the admin controller layer that owns external actions).
  async transition(id: TournamentId, toStatus: TournamentStatus): Promise<TournamentDocument> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) throw new NotFoundException('Tournament not found.');

    assertTransition(tournament.status, toStatus);

    const patch: UpdateTournamentInput = {
      status: toStatus,
      ...(toStatus === 'published' && tournament.publishedAt == null
        ? { publishedAt: new Date() }
        : {}),
      ...(toStatus === 'cancelled' ? { cancelledAt: new Date() } : {}),
    };

    const updated = await this.tournamentRepository.update(id, patch);
    if (!updated) throw new NotFoundException('Tournament not found.');
    return updated;
  }

  async softDelete(id: TournamentId): Promise<TournamentDocument> {
    const updated = await this.tournamentRepository.softDelete(id);
    if (!updated) throw new NotFoundException('Tournament not found.');
    return updated;
  }

  private async assertGameAvailable(gameId: string): Promise<void> {
    const game = await this.gameService.findById(gameId);
    if (!game) {
      throw new UnprocessableEntityException(`Game "${gameId}" not found.`);
    }
    if (game.status !== 'active') {
      throw new UnprocessableEntityException(
        `Game "${gameId}" is not available (status: ${game.status}).`,
      );
    }
  }

  private normalizeSlugOrThrow(slug: string): string {
    try {
      return normalizeSlug(slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }
}
