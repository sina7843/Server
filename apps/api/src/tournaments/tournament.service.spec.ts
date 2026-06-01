import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import type { TournamentDocument } from './tournament.schema';

function makeTournament(overrides: Partial<Record<string, unknown>> = {}): TournamentDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    title: 'Dragon Cup 2026',
    slug: 'dragon-cup-2026',
    slugNormalized: 'dragon-cup-2026',
    format: 'single_elimination',
    status: 'draft',
    participantType: 'individual',
    capacity: 64,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as TournamentDocument;
}

function makeGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: '507f1f77bcf86cd799439012',
    name: 'Counter-Strike',
    slug: 'counter-strike',
    slugNormalized: 'counter-strike',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const GAME_ID = '507f1f77bcf86cd799439012';
const TOURNAMENT_ID = '507f1f77bcf86cd799439011';

describe('TournamentService', () => {
  let service: TournamentService;
  let repoMock: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
    existsBySlug: jest.Mock;
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let gameServiceMock: { findById: jest.Mock };

  beforeEach(() => {
    repoMock = {
      findById: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      existsBySlug: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      create: jest.fn().mockResolvedValue(makeTournament()),
      update: jest.fn().mockResolvedValue(null),
      softDelete: jest.fn().mockResolvedValue(null),
    };
    gameServiceMock = { findById: jest.fn().mockResolvedValue(makeGame()) };
    service = new TournamentService(repoMock as never, gameServiceMock as never);
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('delegates to the repository', async () => {
      const t = makeTournament();
      repoMock.findById.mockResolvedValue(t);
      const result = await service.findById(TOURNAMENT_ID);
      expect(result).toBe(t);
      expect(repoMock.findById).toHaveBeenCalledWith(TOURNAMENT_ID);
    });

    it('returns null when not found', async () => {
      repoMock.findById.mockResolvedValue(null);
      expect(await service.findById(TOURNAMENT_ID)).toBeNull();
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('delegates filter, page, and limit to the repository', async () => {
      const t = makeTournament();
      repoMock.list.mockResolvedValue({ items: [t], total: 1 });

      const result = await service.list({ status: 'draft', includeDeleted: false }, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repoMock.list).toHaveBeenCalledWith({ status: 'draft', includeDeleted: false }, 1, 20);
    });

    it('returns empty list when no tournaments match', async () => {
      const result = await service.list({ status: 'published', includeDeleted: false });
      expect(result.items).toHaveLength(0);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const baseInput = {
      gameId: GAME_ID,
      title: 'Dragon Cup 2026',
      slug: 'dragon-cup-2026',
      format: 'single_elimination' as const,
      capacity: 64,
    };

    it('creates a tournament when gameId is valid and active', async () => {
      const t = makeTournament();
      repoMock.create.mockResolvedValue(t);

      const result = await service.create(baseInput);

      expect(result).toBe(t);
      expect(gameServiceMock.findById).toHaveBeenCalledWith(GAME_ID);
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ slugNormalized: 'dragon-cup-2026' }),
      );
    });

    it('normalizes slug to lowercase', async () => {
      repoMock.create.mockResolvedValue(makeTournament());

      await service.create({ ...baseInput, slug: 'Dragon-Cup-2026' });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ slugNormalized: 'dragon-cup-2026' }),
      );
    });

    it('throws UnprocessableEntityException when gameId does not exist', async () => {
      gameServiceMock.findById.mockResolvedValue(null);

      await expect(service.create(baseInput)).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when game is inactive', async () => {
      gameServiceMock.findById.mockResolvedValue(makeGame({ status: 'inactive' }));

      await expect(service.create(baseInput)).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when game is archived', async () => {
      gameServiceMock.findById.mockResolvedValue(makeGame({ status: 'archived' }));

      await expect(service.create(baseInput)).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws ConflictException when slug is already taken', async () => {
      repoMock.existsBySlug.mockResolvedValue(makeTournament());

      await expect(service.create(baseInput)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when slug contains invalid characters', async () => {
      await expect(
        service.create({ ...baseInput, slug: 'invalid slug with spaces!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when slug is empty', async () => {
      await expect(service.create({ ...baseInput, slug: '' })).rejects.toThrow(ConflictException);
    });

    it('passes optional fields through to the repository', async () => {
      repoMock.create.mockResolvedValue(makeTournament());

      await service.create({
        ...baseInput,
        description: 'The biggest cup',
        rules: 'No cheating.',
        capacity: 128,
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'The biggest cup',
          rules: 'No cheating.',
          capacity: 128,
        }),
      );
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates a tournament and returns the updated document', async () => {
      const updated = makeTournament({ title: 'Updated Cup' });
      repoMock.update.mockResolvedValue(updated);

      const result = await service.update(TOURNAMENT_ID, { title: 'Updated Cup' });

      expect(result).toBe(updated);
    });

    it('throws NotFoundException when tournament does not exist', async () => {
      repoMock.update.mockResolvedValue(null);

      await expect(service.update(TOURNAMENT_ID, { title: 'New Title' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('normalizes slug when slug is updated', async () => {
      const updated = makeTournament({ slug: 'new-slug', slugNormalized: 'new-slug' });
      repoMock.update.mockResolvedValue(updated);

      await service.update(TOURNAMENT_ID, { slug: 'New-Slug' });

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ slugNormalized: 'new-slug' }),
      );
    });

    it('throws ConflictException when updated slug is taken by another tournament', async () => {
      repoMock.existsBySlug.mockResolvedValue(makeTournament({ _id: 'other-id' }));

      await expect(service.update(TOURNAMENT_ID, { slug: 'taken-slug' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not check slug uniqueness when slug is absent from the update', async () => {
      const updated = makeTournament({ title: 'Updated' });
      repoMock.update.mockResolvedValue(updated);

      await service.update(TOURNAMENT_ID, { title: 'Updated' });

      expect(repoMock.existsBySlug).not.toHaveBeenCalled();
    });

    it('validates gameId when it is present in the update', async () => {
      const updated = makeTournament();
      repoMock.update.mockResolvedValue(updated);

      await service.update(TOURNAMENT_ID, { gameId: GAME_ID });

      expect(gameServiceMock.findById).toHaveBeenCalledWith(GAME_ID);
    });

    it('throws UnprocessableEntityException when updated gameId is nonexistent', async () => {
      gameServiceMock.findById.mockResolvedValue(null);

      await expect(service.update(TOURNAMENT_ID, { gameId: GAME_ID })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException when updated game is inactive', async () => {
      gameServiceMock.findById.mockResolvedValue(makeGame({ status: 'inactive' }));

      await expect(service.update(TOURNAMENT_ID, { gameId: GAME_ID })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('does not validate gameId when it is absent from the update', async () => {
      const updated = makeTournament({ title: 'Updated' });
      repoMock.update.mockResolvedValue(updated);

      await service.update(TOURNAMENT_ID, { title: 'Updated' });

      expect(gameServiceMock.findById).not.toHaveBeenCalled();
    });
  });

  // ─── softDelete ───────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('soft deletes a tournament and returns the deleted document', async () => {
      const deleted = makeTournament({ deletedAt: new Date() });
      repoMock.softDelete.mockResolvedValue(deleted);

      const result = await service.softDelete(TOURNAMENT_ID);

      expect(result).toBe(deleted);
      expect(repoMock.softDelete).toHaveBeenCalledWith(TOURNAMENT_ID);
    });

    it('throws NotFoundException when tournament does not exist or is already deleted', async () => {
      repoMock.softDelete.mockResolvedValue(null);

      await expect(service.softDelete(TOURNAMENT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── transition ───────────────────────────────────────────────────────────

  describe('transition', () => {
    it('transitions draft -> published and sets publishedAt', async () => {
      const draft = makeTournament({ status: 'draft', publishedAt: undefined });
      const published = makeTournament({ status: 'published', publishedAt: new Date() });
      repoMock.findById.mockResolvedValue(draft);
      repoMock.update.mockResolvedValue(published);

      const result = await service.transition(TOURNAMENT_ID, 'published');

      expect(result.status).toBe('published');
      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ status: 'published', publishedAt: expect.any(Date) }),
      );
    });

    it('does not overwrite publishedAt if already set', async () => {
      const existingPublishedAt = new Date('2026-01-01');
      const draft = makeTournament({ status: 'draft', publishedAt: existingPublishedAt });
      repoMock.findById.mockResolvedValue(draft);
      repoMock.update.mockResolvedValue(makeTournament({ status: 'published' }));

      await service.transition(TOURNAMENT_ID, 'published');

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.not.objectContaining({ publishedAt: expect.any(Date) }),
      );
    });

    it('sets cancelledAt when transitioning to cancelled', async () => {
      const draft = makeTournament({ status: 'draft' });
      repoMock.findById.mockResolvedValue(draft);
      repoMock.update.mockResolvedValue(makeTournament({ status: 'cancelled' }));

      await service.transition(TOURNAMENT_ID, 'cancelled');

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ status: 'cancelled', cancelledAt: expect.any(Date) }),
      );
    });

    it('throws NotFoundException when tournament is not found', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.transition(TOURNAMENT_ID, 'published')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException for illegal transition (completed -> in_progress)', async () => {
      repoMock.findById.mockResolvedValue(makeTournament({ status: 'completed' }));

      await expect(service.transition(TOURNAMENT_ID, 'in_progress')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException for illegal transition (archived -> draft)', async () => {
      repoMock.findById.mockResolvedValue(makeTournament({ status: 'archived' }));

      await expect(service.transition(TOURNAMENT_ID, 'draft')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException for illegal transition (draft -> in_progress)', async () => {
      repoMock.findById.mockResolvedValue(makeTournament({ status: 'draft' }));

      await expect(service.transition(TOURNAMENT_ID, 'in_progress')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('transitions in_progress -> completed without setting lifecycle timestamps', async () => {
      const inProgress = makeTournament({ status: 'in_progress' });
      const completed = makeTournament({ status: 'completed' });
      repoMock.findById.mockResolvedValue(inProgress);
      repoMock.update.mockResolvedValue(completed);

      await service.transition(TOURNAMENT_ID, 'completed');

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ status: 'completed' }),
      );
    });
  });

  // ─── date-window validation wiring ────────────────────────────────────────

  describe('create — date-window validation', () => {
    const baseInput = {
      gameId: GAME_ID,
      title: 'Dragon Cup 2026',
      slug: 'dragon-cup-2026',
      format: 'single_elimination' as const,
      capacity: 64,
    };

    it('rejects create when registrationCloseAt is before registrationOpenAt', async () => {
      await expect(
        service.create({
          ...baseInput,
          registrationOpenAt: new Date('2026-03-01'),
          registrationCloseAt: new Date('2026-02-01'),
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects create when endsAt is before startsAt', async () => {
      await expect(
        service.create({
          ...baseInput,
          startsAt: new Date('2026-04-01'),
          endsAt: new Date('2026-03-01'),
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── create — format/capacity/title validation ────────────────────────────

  describe('create — field validation', () => {
    const baseInput = {
      gameId: GAME_ID,
      title: 'Dragon Cup 2026',
      slug: 'dragon-cup-2026',
      format: 'single_elimination' as const,
      capacity: 64,
    };

    it('rejects swiss format', async () => {
      await expect(service.create({ ...baseInput, format: 'swiss' as never })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('rejects double_elimination format', async () => {
      await expect(
        service.create({ ...baseInput, format: 'double_elimination' as never }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects advanced_bracket_editor format', async () => {
      await expect(
        service.create({ ...baseInput, format: 'advanced_bracket_editor' as never }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects capacity 0', async () => {
      await expect(service.create({ ...baseInput, capacity: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects capacity negative', async () => {
      await expect(service.create({ ...baseInput, capacity: -1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects empty title', async () => {
      await expect(service.create({ ...baseInput, title: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects whitespace-only title', async () => {
      await expect(service.create({ ...baseInput, title: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects unsupported status on create', async () => {
      await expect(service.create({ ...baseInput, status: 'open' as never })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── update — field validation ────────────────────────────────────────────

  describe('update — field validation', () => {
    it('rejects swiss format in update', async () => {
      await expect(service.update(TOURNAMENT_ID, { format: 'swiss' as never })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('rejects double_elimination format in update', async () => {
      await expect(
        service.update(TOURNAMENT_ID, { format: 'double_elimination' as never }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects advanced_bracket_editor format in update', async () => {
      await expect(
        service.update(TOURNAMENT_ID, { format: 'advanced_bracket_editor' as never }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects capacity 0 in update', async () => {
      await expect(service.update(TOURNAMENT_ID, { capacity: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects empty title in update', async () => {
      await expect(service.update(TOURNAMENT_ID, { title: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── update — status bypass prevention ───────────────────────────────────

  describe('update — status bypass prevention', () => {
    it('UpdateTournamentInput type has no status field (type-level boundary)', () => {
      // Verify at the source level that UpdateTournamentInput intentionally
      // excludes status — transition() is the only valid lifecycle path.
      const src = readFileSync(join(__dirname, 'tournament.types.ts'), 'utf8');
      // UpdateTournamentInput interface block must not have a status property.
      // The TournamentRepositoryPatch (internal) may have it, but not the public input.
      const updateInputBlock =
        src.match(/export interface UpdateTournamentInput \{[\s\S]*?\n\}/)?.[0] ?? '';
      expect(updateInputBlock).not.toContain('status');
    });

    it('service source uses UpdateTournamentInput (no status) as the update() parameter', () => {
      const src = readFileSync(join(__dirname, 'tournament.service.ts'), 'utf8');
      expect(src).toContain('update(id: TournamentId, input: UpdateTournamentInput)');
    });

    it('repository update uses TournamentRepositoryPatch (not UpdateTournamentInput)', () => {
      const src = readFileSync(join(__dirname, 'tournament.repository.ts'), 'utf8');
      expect(src).toContain('TournamentRepositoryPatch');
      expect(src).not.toContain('update(id: TournamentId, input: UpdateTournamentInput)');
    });

    it('transition() sets status via TournamentRepositoryPatch (not UpdateTournamentInput)', () => {
      const src = readFileSync(join(__dirname, 'tournament.service.ts'), 'utf8');
      expect(src).toContain('TournamentRepositoryPatch');
    });
  });

  // ─── transition — archivedAt timestamp ───────────────────────────────────

  describe('transition — archivedAt timestamp', () => {
    it('sets archivedAt when transitioning to archived from completed', async () => {
      const completed = makeTournament({ status: 'completed' });
      const archived = makeTournament({ status: 'archived', archivedAt: new Date() });
      repoMock.findById.mockResolvedValue(completed);
      repoMock.update.mockResolvedValue(archived);

      await service.transition(TOURNAMENT_ID, 'archived');

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ status: 'archived', archivedAt: expect.any(Date) }),
      );
    });

    it('sets archivedAt when transitioning to archived from cancelled', async () => {
      const cancelled = makeTournament({ status: 'cancelled' });
      repoMock.findById.mockResolvedValue(cancelled);
      repoMock.update.mockResolvedValue(makeTournament({ status: 'archived' }));

      await service.transition(TOURNAMENT_ID, 'archived');

      expect(repoMock.update).toHaveBeenCalledWith(
        TOURNAMENT_ID,
        expect.objectContaining({ status: 'archived', archivedAt: expect.any(Date) }),
      );
    });
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('TournamentService — scope guardrails', () => {
  it('no external tournament CRUD controller exists', () => {
    expect(existsSync(join(__dirname, 'tournament.controller.ts'))).toBe(false);
  });

  it('no fake tournament seed file exists', () => {
    expect(existsSync(join(__dirname, 'tournament-seed.ts'))).toBe(false);
    expect(existsSync(join(__dirname, 'seeds'))).toBe(false);
  });

  it('service has no bracket references', () => {
    const src = readFileSync(join(__dirname, 'tournament.service.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('service has no prize, payment, shop, or streaming fields', () => {
    const src = readFileSync(join(__dirname, 'tournament.service.ts'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('service has no hardcoded localhost or domain', () => {
    const src = readFileSync(join(__dirname, 'tournament.service.ts'), 'utf8');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('schema has no bracket collection', () => {
    const src = readFileSync(join(__dirname, 'tournament.schema.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('schema has no prize, payment, shop, or streaming fields', () => {
    const src = readFileSync(join(__dirname, 'tournament.schema.ts'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('schema has no Swiss or Double Elimination specific config fields', () => {
    const src = readFileSync(join(__dirname, 'tournament.schema.ts'), 'utf8');
    expect(src).not.toMatch(/swiss|doubleElim|double_elim/i);
  });

  it('repository has no bracket collection', () => {
    const src = readFileSync(join(__dirname, 'tournament.repository.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });
});
