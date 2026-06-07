import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TournamentStatus } from '@dragon/types';
import { REGISTRATION_OPEN_STATUS } from './tournament.constants';
import { normalizeSlug, SlugPolicyError } from '../content/slug/slug-policy';
import { GameService } from '../games/game.service';
import { assertTransition } from './tournament-policy';
import {
  assertTournamentTitle,
  assertTournamentGameId,
  assertTournamentFormat,
  assertTournamentStatus,
  assertTournamentCapacity,
  assertRegistrationWindow,
  assertTournamentSchedule,
} from './tournament-validation';
import { TournamentRepository } from './tournament.repository';
import type { TournamentDocument } from './tournament.schema';
import { InvalidTournamentFilterError } from './tournament.types';
import type {
  TournamentId,
  CreateTournamentInput,
  UpdateTournamentInput,
  TournamentRepositoryPatch,
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

  findBySlug(slug: string): Promise<TournamentDocument | null> {
    return this.tournamentRepository.findBySlug(slug.toLowerCase().trim());
  }

  async list(
    filter: TournamentListFilter,
    page?: number,
    limit?: number,
  ): Promise<{ items: TournamentDocument[]; total: number }> {
    // Symmetric contradiction guard for explicit scalar status + registrationOpen pairs.
    // registrationOpen=false contradicts status=registration_open (a tournament cannot be
    // simultaneously in registration_open status and not registration-open by time window).
    // registrationOpen=true contradicts any non-registration_open status (a tournament in
    // published/cancelled/etc. status cannot simultaneously satisfy the registration-open filter).
    // statuses[] (internal public-safe array) is NOT checked here — it is not a direct user
    // intent filter and the statuses-bypass finding was verified as non-contradictory.
    if (filter.status === REGISTRATION_OPEN_STATUS && filter.registrationOpen === false) {
      throw new BadRequestException(
        'status=registration_open cannot be combined with registrationOpen=false.',
      );
    }
    if (
      filter.status !== undefined &&
      filter.status !== REGISTRATION_OPEN_STATUS &&
      filter.registrationOpen === true
    ) {
      throw new BadRequestException(
        `status=${filter.status} cannot be combined with registrationOpen=true.`,
      );
    }
    return this.tournamentRepository.list(filter, page, limit);
  }

  async create(input: CreateTournamentInput): Promise<TournamentDocument> {
    assertTournamentTitle(input.title);
    assertTournamentGameId(input.gameId);
    assertTournamentFormat(input.format);
    assertTournamentCapacity(input.capacity);
    if (input.status !== undefined) assertTournamentStatus(input.status);
    assertRegistrationWindow(input.registrationOpenAt, input.registrationCloseAt);
    assertTournamentSchedule(input.startsAt, input.endsAt);

    await this.assertGameAvailable(input.gameId);

    const slugNormalized = this.normalizeSlugOrThrow(input.slug);
    const taken = await this.tournamentRepository.existsBySlug(slugNormalized);
    if (taken) {
      throw new ConflictException(`Tournament slug "${input.slug}" is already taken.`);
    }

    return this.tournamentRepository.create({ ...input, slugNormalized });
  }

  async update(id: TournamentId, input: UpdateTournamentInput): Promise<TournamentDocument> {
    // UpdateTournamentInput intentionally has no status field — use transition() for
    // status changes. This type-level boundary is enforced at the service signature.
    if (input.title !== undefined) assertTournamentTitle(input.title);
    if (input.gameId !== undefined) {
      assertTournamentGameId(input.gameId);
      await this.assertGameAvailable(input.gameId);
    }
    if (input.format !== undefined) assertTournamentFormat(input.format);
    if (input.capacity !== undefined) assertTournamentCapacity(input.capacity);
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

    const patch: TournamentRepositoryPatch = {
      ...input,
      ...(slugNormalized !== undefined ? { slugNormalized } : {}),
    };

    const updated = await this.tournamentRepository.update(id, patch);

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

    const patch: TournamentRepositoryPatch = {
      status: toStatus,
      ...(toStatus === 'published' && tournament.publishedAt == null
        ? { publishedAt: new Date() }
        : {}),
      ...(toStatus === 'cancelled' ? { cancelledAt: new Date() } : {}),
      ...(toStatus === 'archived' ? { archivedAt: new Date() } : {}),
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
