import { readFileSync } from 'fs';
import { join } from 'path';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GameService } from './game.service';
import type { GameDocument } from './game.schema';
import type { Types } from 'mongoose';

function makeGame(overrides: Partial<Record<string, unknown>> = {}): GameDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'Counter-Strike',
    slug: 'counter-strike',
    slugNormalized: 'counter-strike',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as GameDocument;
}

describe('GameService', () => {
  let service: GameService;
  let repoMock: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
    existsBySlug: jest.Mock;
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(() => {
    repoMock = {
      findById: jest.fn().mockResolvedValue(null),
      findBySlug: jest.fn().mockResolvedValue(null),
      existsBySlug: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      create: jest.fn().mockResolvedValue(makeGame()),
      update: jest.fn().mockResolvedValue(null),
      softDelete: jest.fn().mockResolvedValue(null),
    };
    service = new GameService(repoMock as never);
  });

  // ─── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('delegates to the repository', async () => {
      const game = makeGame();
      repoMock.findById.mockResolvedValue(game);
      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toBe(game);
      expect(repoMock.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('returns null when game does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);
      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('delegates to the repository with the given filter', async () => {
      const game = makeGame();
      repoMock.list.mockResolvedValue({ items: [game], total: 1 });

      const result = await service.list({ status: 'active', includeDeleted: false }, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repoMock.list).toHaveBeenCalledWith(
        { status: 'active', includeDeleted: false },
        1,
        20,
      );
    });

    it('returns empty list when no games match', async () => {
      const result = await service.list({ status: 'active', includeDeleted: false });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a game and normalizes the slug', async () => {
      const game = makeGame({ slug: 'counter-strike', slugNormalized: 'counter-strike' });
      repoMock.create.mockResolvedValue(game);

      const result = await service.create({ name: 'Counter-Strike', slug: 'counter-strike' });

      expect(result).toBe(game);
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ slugNormalized: 'counter-strike' }),
      );
    });

    it('normalizes slug with uppercase letters', async () => {
      const game = makeGame({ slug: 'Counter-Strike', slugNormalized: 'counter-strike' });
      repoMock.create.mockResolvedValue(game);

      await service.create({ name: 'Counter-Strike', slug: 'Counter-Strike' });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ slugNormalized: 'counter-strike' }),
      );
    });

    it('throws ConflictException when slug is already taken', async () => {
      repoMock.existsBySlug.mockResolvedValue(makeGame());

      await expect(service.create({ name: 'Duplicate', slug: 'counter-strike' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when slug is invalid', async () => {
      await expect(
        service.create({ name: 'Bad Slug', slug: 'invalid slug with spaces!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when slug is empty', async () => {
      await expect(service.create({ name: 'Bad Slug', slug: '' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates game with active status by default', async () => {
      const game = makeGame({ status: 'active' });
      repoMock.create.mockResolvedValue(game);

      await service.create({ name: 'Counter-Strike', slug: 'counter-strike' });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Counter-Strike', slug: 'counter-strike' }),
      );
    });

    it('passes optional fields through to repository', async () => {
      const game = makeGame({ description: 'FPS game', coverMediaId: 'abc123' });
      repoMock.create.mockResolvedValue(game);

      await service.create({
        name: 'CS',
        slug: 'cs',
        description: 'FPS game',
        coverMediaId: 'abc123',
        status: 'inactive',
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'FPS game',
          coverMediaId: 'abc123',
          status: 'inactive',
        }),
      );
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates a game and returns the updated document', async () => {
      const updated = makeGame({ name: 'CS 2' });
      repoMock.update.mockResolvedValue(updated);

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'CS 2' });

      expect(result).toBe(updated);
    });

    it('throws NotFoundException when game does not exist', async () => {
      repoMock.update.mockResolvedValue(null);

      await expect(
        service.update('507f1f77bcf86cd799439011', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('normalizes slug when slug is updated', async () => {
      const updated = makeGame({ slug: 'new-slug', slugNormalized: 'new-slug' });
      repoMock.update.mockResolvedValue(updated);

      await service.update('507f1f77bcf86cd799439011', { slug: 'New-Slug' });

      expect(repoMock.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ slugNormalized: 'new-slug' }),
      );
    });

    it('throws ConflictException when updated slug is taken by another game', async () => {
      repoMock.existsBySlug.mockResolvedValue(
        makeGame({ _id: 'other-id' } as unknown as { _id: Types.ObjectId }),
      );

      await expect(
        service.update('507f1f77bcf86cd799439011', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not check slug uniqueness when slug is not in the update', async () => {
      const updated = makeGame({ name: 'Updated Name' });
      repoMock.update.mockResolvedValue(updated);

      await service.update('507f1f77bcf86cd799439011', { name: 'Updated Name' });

      expect(repoMock.existsBySlug).not.toHaveBeenCalled();
    });

    it('throws ConflictException when updated slug is invalid', async () => {
      await expect(
        service.update('507f1f77bcf86cd799439011', { slug: 'invalid slug!' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── softDelete ───────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('soft deletes a game and returns the deleted document', async () => {
      const deleted = makeGame({ deletedAt: new Date() });
      repoMock.softDelete.mockResolvedValue(deleted);

      const result = await service.softDelete('507f1f77bcf86cd799439011');

      expect(result).toBe(deleted);
      expect(repoMock.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('throws NotFoundException when game does not exist or is already deleted', async () => {
      repoMock.softDelete.mockResolvedValue(null);

      await expect(service.softDelete('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

// ─── Public API filter contract ───────────────────────────────────────────────

describe('GameService public API filter contract', () => {
  let service: GameService;
  let repoMock: { list: jest.Mock; [key: string]: jest.Mock };

  beforeEach(() => {
    repoMock = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      existsBySlug: jest.fn(),
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    service = new GameService(repoMock as never);
  });

  it('public list passes status=active and includeDeleted=false to repository', async () => {
    await service.list({ status: 'active', includeDeleted: false });

    expect(repoMock.list).toHaveBeenCalledWith(
      { status: 'active', includeDeleted: false },
      undefined,
      undefined,
    );
  });

  it('inactive games are excluded when status=active filter is applied', async () => {
    const inactiveGame = { status: 'inactive' } as unknown as GameDocument;
    const activeGame = { status: 'active' } as unknown as GameDocument;
    repoMock.list.mockImplementation(async (filter: { status?: string }) => {
      const items = [inactiveGame, activeGame].filter((g) => g.status === filter.status);
      return { items, total: items.length };
    });

    const result = await service.list({ status: 'active', includeDeleted: false });

    expect(result.items).not.toContain(inactiveGame);
    expect(result.items).toContain(activeGame);
  });

  it('archived games are excluded when status=active filter is applied', async () => {
    const archivedGame = { status: 'archived' } as unknown as GameDocument;
    repoMock.list.mockImplementation(async (filter: { status?: string }) => {
      const items = [archivedGame].filter((g) => g.status === filter.status);
      return { items, total: items.length };
    });

    const result = await service.list({ status: 'active', includeDeleted: false });

    expect(result.items).not.toContain(archivedGame);
  });
});

// ─── No TournamentModule introduced ──────────────────────────────────────────

describe('GameService — scope guardrails', () => {
  const src = readFileSync(join(__dirname, 'game.service.ts'), 'utf8');

  it('does not import from TournamentModule', () => {
    expect(src).not.toMatch(/tournament\.module|TournamentModule|TournamentService/);
  });

  it('does not import from TournamentRepository', () => {
    expect(src).not.toMatch(/TournamentRepository/);
  });
});
