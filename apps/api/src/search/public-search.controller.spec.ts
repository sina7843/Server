import { BadRequestException } from '@nestjs/common';
import { PublicSearchController } from './public-search.controller';
import { parsePublicContentSearchQuery } from './dto/public-search-query';
import { parseTournamentSearchQuery } from './dto/tournament-search-query';
import type { TournamentService } from '../tournaments/tournament.service';
import type { TournamentDocument } from '../tournaments/tournament.schema';

const mockResult = {
  items: [
    {
      id: '64f000000000000000000001',
      type: 'news',
      title: 'Test Article',
      slug: 'test-article',
      route: '/news/test-article',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

function makeTournamentDoc(overrides: Partial<Record<string, unknown>> = {}): TournamentDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    title: 'Dragon Cup 2026',
    slug: 'dragon-cup-2026',
    slugNormalized: 'dragon-cup-2026',
    format: 'single_elimination',
    status: 'published',
    participantType: 'individual',
    capacity: 64,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  } as unknown as TournamentDocument;
}

function createController(
  tournamentListResult: { items: TournamentDocument[]; total: number } = { items: [], total: 0 },
) {
  const service = {
    searchPublicContent: jest.fn().mockResolvedValue(mockResult),
    searchAdminContent: jest.fn(),
    searchAdminUsers: jest.fn(),
    searchAdminMedia: jest.fn(),
    reindex: jest.fn(),
  };
  const tournamentService: jest.Mocked<Pick<TournamentService, 'list'>> = {
    list: jest.fn().mockResolvedValue(tournamentListResult),
  };
  return {
    service,
    tournamentService,
    controller: new PublicSearchController(
      service as never,
      tournamentService as unknown as TournamentService,
    ),
  };
}

describe('PublicSearchController', () => {
  describe('GET /api/v1/search/content', () => {
    it('returns search results with default pagination', async () => {
      const { controller, service } = createController();
      const result = await controller.searchContent({});

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(1);
    });

    it('passes q parameter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ q: 'football' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'football' }),
      );
    });

    it('passes type filter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ type: 'news' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'news' }),
      );
    });

    it('accepts page type filter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ type: 'page' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'page' }),
      );
    });

    it('passes pagination parameters', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ page: '2', limit: '10' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });

    it('result routes are type-specific — no generic /posts/:slug', async () => {
      const { controller } = createController();
      const result = await controller.searchContent({});

      for (const item of result.items) {
        expect(item.route).not.toMatch(/^\/posts\//);
      }
    });

    it('result route for news uses /news/:slug', () => {
      expect(mockResult.items[0]?.route).toBe('/news/test-article');
    });
  });
});

describe('parsePublicContentSearchQuery', () => {
  it('validates valid type values', () => {
    const types = ['news', 'article', 'announcement', 'guide', 'rule', 'page'];
    for (const type of types) {
      expect(() => parsePublicContentSearchQuery({ type })).not.toThrow();
    }
  });

  it('rejects invalid type', () => {
    expect(() => parsePublicContentSearchQuery({ type: 'blog' })).toThrow(BadRequestException);
  });

  it('rejects invalid categoryId', () => {
    expect(() => parsePublicContentSearchQuery({ categoryId: 'not-valid' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects type=page with categoryId', () => {
    expect(() =>
      parsePublicContentSearchQuery({ type: 'page', categoryId: '64f000000000000000000001' }),
    ).toThrow(BadRequestException);
  });

  it('rejects type=page with tagId', () => {
    expect(() =>
      parsePublicContentSearchQuery({ type: 'page', tagId: '64f000000000000000000001' }),
    ).toThrow(BadRequestException);
  });

  it('allows type=page without categoryId or tagId', () => {
    expect(() => parsePublicContentSearchQuery({ type: 'page' })).not.toThrow();
  });

  it('allows categoryId without type=page', () => {
    expect(() =>
      parsePublicContentSearchQuery({ categoryId: '64f000000000000000000001' }),
    ).not.toThrow();
  });

  it('rejects invalid tagId', () => {
    expect(() => parsePublicContentSearchQuery({ tagId: 'not-valid' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects limit above max', () => {
    expect(() => parsePublicContentSearchQuery({ limit: '100' })).toThrow(BadRequestException);
  });

  it('rejects page below 1', () => {
    expect(() => parsePublicContentSearchQuery({ page: '0' })).toThrow(BadRequestException);
  });

  it('rejects q longer than 200 chars', () => {
    expect(() => parsePublicContentSearchQuery({ q: 'a'.repeat(201) })).toThrow(
      BadRequestException,
    );
  });

  it('returns default page and limit when not provided', () => {
    const result = parsePublicContentSearchQuery({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('omits undefined optional fields', () => {
    const result = parsePublicContentSearchQuery({ page: '1' });
    expect('q' in result).toBe(false);
    expect('type' in result).toBe(false);
    expect('categoryId' in result).toBe(false);
    expect('tagId' in result).toBe(false);
  });
});

// ─── GET /api/v1/search/tournaments ──────────────────────────────────────────

describe('PublicSearchController — GET /api/v1/search/tournaments', () => {
  it('endpoint exists on controller', () => {
    const { controller } = createController();
    expect(typeof controller.searchTournaments).toBe('function');
  });

  it('returns TournamentListResponseDto-compatible shape', async () => {
    const doc = makeTournamentDoc();
    const { controller } = createController({ items: [doc], total: 1 });

    const result = await controller.searchTournaments({});

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total', 1);
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('passes q as titleSearch to tournament service', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ q: 'cup' });

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ titleSearch: 'cup' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('passes no titleSearch when q is absent', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({});

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('titleSearch');
  });

  it('applies public-safe statuses restriction when no explicit status filter', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({});

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).toHaveProperty('statuses');
    expect(callFilter).not.toHaveProperty('status');
    const statuses = callFilter.statuses as string[];
    expect(statuses.includes('draft')).toBe(false);
    expect(statuses.includes('archived')).toBe(false);
    expect(statuses.includes('published')).toBe(true);
    expect(statuses.includes('cancelled')).toBe(true);
  });

  it('passes explicit public-safe status filter', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ status: 'published' });

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('silently ignores draft status (not public-safe)', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ status: 'draft' });

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('status');
    expect(callFilter).toHaveProperty('statuses');
  });

  it('passes gameId filter', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ gameId: 'game-abc' });

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'game-abc' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('passes format filter (valid)', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ format: 'single_elimination' });

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'single_elimination' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('silently ignores unsupported format', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ format: 'swiss' });

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('passes registrationOpen=true', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ registrationOpen: 'true' });

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: true }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('uses default page=1 limit=20 when not provided', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({});

    expect(tournamentService.list).toHaveBeenCalledWith(expect.any(Object), 1, 20);
  });

  it('passes custom page and limit', async () => {
    const { controller, tournamentService } = createController();

    await controller.searchTournaments({ page: '2', limit: '50' });

    expect(tournamentService.list).toHaveBeenCalledWith(expect.any(Object), 2, 50);
  });

  it('result items exclude internal/admin fields', async () => {
    const doc = makeTournamentDoc({
      cancelledAt: new Date(),
      archivedAt: new Date(),
      deletedAt: new Date(),
    });
    const { controller } = createController({ items: [doc], total: 1 });

    const result = await controller.searchTournaments({});
    const item = result.items[0] as unknown as Record<string, unknown>;

    expect(item).not.toHaveProperty('cancelledAt');
    expect(item).not.toHaveProperty('archivedAt');
    expect(item).not.toHaveProperty('deletedAt');
    expect(item).not.toHaveProperty('slugNormalized');
  });

  it('result items do not include description (summary projection)', async () => {
    const doc = makeTournamentDoc({ description: 'The biggest cup' });
    const { controller } = createController({ items: [doc], total: 1 });

    const result = await controller.searchTournaments({});
    const item = result.items[0] as unknown as Record<string, unknown>;

    expect(item).not.toHaveProperty('description');
  });
});

// ─── parseTournamentSearchQuery ───────────────────────────────────────────────

describe('parseTournamentSearchQuery', () => {
  it('returns default page and limit when not provided', () => {
    const result = parseTournamentSearchQuery({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('passes q through', () => {
    const result = parseTournamentSearchQuery({ q: 'cup' });
    expect(result.q).toBe('cup');
  });

  it('rejects q longer than 200 chars', () => {
    expect(() => parseTournamentSearchQuery({ q: 'a'.repeat(201) })).toThrow(BadRequestException);
  });

  it('silently drops non-public-safe status (draft)', () => {
    const result = parseTournamentSearchQuery({ status: 'draft' });
    expect('status' in result).toBe(false);
  });

  it('silently drops non-public-safe status (archived)', () => {
    const result = parseTournamentSearchQuery({ status: 'archived' });
    expect('status' in result).toBe(false);
  });

  it('passes public-safe status (cancelled)', () => {
    const result = parseTournamentSearchQuery({ status: 'cancelled' });
    expect(result.status).toBe('cancelled');
  });

  it('silently drops unsupported format (swiss)', () => {
    const result = parseTournamentSearchQuery({ format: 'swiss' });
    expect('format' in result).toBe(false);
  });

  it('passes supported format', () => {
    const result = parseTournamentSearchQuery({ format: 'single_elimination' });
    expect(result.format).toBe('single_elimination');
  });

  it('rejects limit above 100', () => {
    expect(() => parseTournamentSearchQuery({ limit: '101' })).toThrow(BadRequestException);
  });

  it('rejects page below 1', () => {
    expect(() => parseTournamentSearchQuery({ page: '0' })).toThrow(BadRequestException);
  });
});
