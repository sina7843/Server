import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import { NotFoundException } from '@nestjs/common';
import { PublicTournamentsController } from './public-tournaments.controller';
import type { TournamentService } from '../tournaments/tournament.service';
import type { TournamentEnrichmentService } from '../tournaments/tournament-enrichment.service';
import type { TournamentDocument } from '../tournaments/tournament.schema';

const noopEnrichmentService = {
  enrichMany: jest.fn().mockResolvedValue(new Map()),
  enrichOne: jest.fn().mockResolvedValue({}),
} as unknown as TournamentEnrichmentService;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDoc(overrides: Partial<Record<string, unknown>> = {}): TournamentDocument {
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

function makeMockService(
  overrides: Partial<{
    list: jest.Mock;
    findBySlug: jest.Mock;
  }> = {},
): jest.Mocked<Pick<TournamentService, 'list' | 'findBySlug'>> {
  return {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    findBySlug: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// ─── GET /api/v1/tournaments ─────────────────────────────────────────────────

describe('PublicTournamentsController — list', () => {
  it('GET /api/v1/tournaments exists (controller defines the list method)', () => {
    const ctrl = new PublicTournamentsController(makeMockService() as unknown as TournamentService, noopEnrichmentService);
    expect(typeof ctrl.list).toBe('function');
  });

  it('returns TournamentListResponseDto-compatible shape', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ list: jest.fn().mockResolvedValue({ items: [doc], total: 1 }) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.list();

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total', 1);
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('list items include public summary fields', async () => {
    const doc = makeDoc({ publishedAt: new Date('2026-01-10T00:00:00Z') });
    const svc = makeMockService({ list: jest.fn().mockResolvedValue({ items: [doc], total: 1 }) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.list();
    const item = result.items[0];

    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('gameId');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('slug');
    expect(item).toHaveProperty('format');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('capacity');
  });

  it('list items exclude internal/admin fields', async () => {
    const doc = makeDoc({ cancelledAt: new Date(), archivedAt: new Date(), deletedAt: new Date() });
    const svc = makeMockService({ list: jest.fn().mockResolvedValue({ items: [doc], total: 1 }) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.list();
    const item = result.items[0] as unknown as Record<string, unknown>;

    expect(item).not.toHaveProperty('cancelledAt');
    expect(item).not.toHaveProperty('archivedAt');
    expect(item).not.toHaveProperty('deletedAt');
    expect(item).not.toHaveProperty('slugNormalized');
    expect(item).not.toHaveProperty('participantType');
  });

  it('list items exclude description (summary only)', async () => {
    const doc = makeDoc({ description: 'A big cup' });
    const svc = makeMockService({ list: jest.fn().mockResolvedValue({ items: [doc], total: 1 }) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.list();
    const item = result.items[0] as unknown as Record<string, unknown>;

    expect(item).not.toHaveProperty('description');
  });

  it('passes gameId filter to service', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, 'game-abc');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'game-abc' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('passes format filter to service', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, 'single_elimination');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'single_elimination' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('ignores unknown format values (silently drops)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, 'unknown_format');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('passes public-safe status filter (published)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, 'published');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('passes public-safe status filter (cancelled)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, 'cancelled');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('silently ignores draft as status filter (not public-safe)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, 'draft');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    // draft is dropped; public safe statuses array is used as fallback
    expect(callFilter).not.toHaveProperty('status');
    expect(callFilter).toHaveProperty('statuses');
    expect((callFilter.statuses as string[]).includes('draft')).toBe(false);
  });

  it('silently ignores archived as status filter (not public-safe)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, 'archived');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('status');
    expect((callFilter.statuses as string[]).includes('archived')).toBe(false);
  });

  it('uses statuses array restriction when no explicit status filter is given', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list();

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).toHaveProperty('statuses');
    expect(callFilter).not.toHaveProperty('status');
    const statuses = callFilter.statuses as string[];
    expect(statuses.includes('draft')).toBe(false);
    expect(statuses.includes('archived')).toBe(false);
    expect(statuses.includes('published')).toBe(true);
    expect(statuses.includes('cancelled')).toBe(true);
  });

  it('passes registrationOpen: true when filter is "true"', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, 'true');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: true }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('passes registrationOpen: false when filter is "false"', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, 'false');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: false }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('uses default pagination when not provided', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list();

    expect(svc.list).toHaveBeenCalledWith(expect.any(Object), 1, 20);
  });

  it('passes custom page and limit', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list('3', '50');

    expect(svc.list).toHaveBeenCalledWith(expect.any(Object), 3, 50);
  });

  it('list does not accept a q/text-search parameter', async () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // No text search on the list route; search uses /api/v1/search/tournaments
    expect(src).not.toMatch(/@Query\('q'\)/);
    expect(src).not.toMatch(/@Query\('search'\)/);
  });
});

// ─── GET /api/v1/tournaments/:slug ───────────────────────────────────────────

describe('PublicTournamentsController — getBySlug', () => {
  it('GET /api/v1/tournaments/:slug exists (controller defines the getBySlug method)', () => {
    const ctrl = new PublicTournamentsController(makeMockService() as unknown as TournamentService, noopEnrichmentService);
    expect(typeof ctrl.getBySlug).toBe('function');
  });

  it('returns TournamentDetailDto-compatible shape for visible tournament', async () => {
    const doc = makeDoc({
      description: 'The biggest cup',
      registrationOpenAt: new Date('2026-02-01T00:00:00Z'),
    });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.getBySlug('dragon-cup-2026');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('gameId');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('format');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('capacity');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('description', 'The biggest cup');
  });

  it('detail excludes cancelledAt (admin-only field)', async () => {
    const doc = makeDoc({ cancelledAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('cancelledAt');
  });

  it('detail excludes deletedAt', async () => {
    const doc = makeDoc({ status: 'published', deletedAt: undefined });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('deletedAt');
  });

  it('detail excludes archivedAt', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('archivedAt');
  });

  it('detail excludes slugNormalized', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('slugNormalized');
  });

  it('detail includes participantType when set (public detail exposes it — task 8.3)', async () => {
    const doc = makeDoc({ participantType: 'team' });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).toHaveProperty('participantType', 'team');
  });

  it('detail omits participantType when not set', async () => {
    const doc = makeDoc({ participantType: undefined });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('participantType');
  });

  it('throws NotFoundException for non-existent tournament (safe 404)', async () => {
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(null) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('no-such-slug')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404 message does not leak internal state', async () => {
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(null) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const error = await ctrl.getBySlug('no-such-slug').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NotFoundException);
    const message = (error as NotFoundException).message;
    expect(message).not.toMatch(/draft|archived|deleted|internal/i);
  });

  it('throws NotFoundException for draft tournament (no state leak)', async () => {
    const doc = makeDoc({ status: 'draft' });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for archived tournament (no state leak)', async () => {
    const doc = makeDoc({ status: 'archived', archivedAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for soft-deleted tournament', async () => {
    const doc = makeDoc({ status: 'published', deletedAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });

  // Cancelled visibility policy (Slice 8):
  // cancelled tournaments are visible publicly for transparency.
  it('returns detail for cancelled tournament (transparency policy)', async () => {
    const doc = makeDoc({ status: 'cancelled', cancelledAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.getBySlug('dragon-cup-2026');

    expect(result.status).toBe('cancelled');
    expect(result).not.toHaveProperty('cancelledAt');
  });

  it('throws NotFoundException for cancelled+deleted tournament', async () => {
    const doc = makeDoc({ status: 'cancelled', deletedAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });

  // archivedAt hardening (Task 8.4 closeout):
  // archivedAt is a soft-archive marker; a tournament with any status + archivedAt set is hidden.
  it('PERMANENT — throws NotFoundException for soft-archived tournament (published+archivedAt)', async () => {
    const doc = makeDoc({ status: 'published', archivedAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('PERMANENT — throws NotFoundException for soft-archived tournament (registration_open+archivedAt)', async () => {
    const doc = makeDoc({ status: 'registration_open', archivedAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await expect(ctrl.getBySlug('dragon-cup-2026')).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── Detail does not include operational dashboard fields ─────────────────────

describe('PublicTournamentsController — detail does not include operational fields', () => {
  it('detail response has no participants list', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('participants');
    expect(result).not.toHaveProperty('registrations');
  });

  it('detail response has no match list', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('matches');
  });

  it('detail response has no standings or bracket', async () => {
    const doc = makeDoc();
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;

    expect(result).not.toHaveProperty('standings');
    expect(result).not.toHaveProperty('bracket');
    expect(result).not.toHaveProperty('results');
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('PublicTournamentsController — scope guardrails', () => {
  const SRC_DIR = __dirname;

  it('controller source has no hardcoded localhost', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/localhost/);
  });

  it('controller source has no hardcoded qesb.ir domain', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/qesb\.ir/);
  });

  it('controller source has no fixed API origin', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/https?:\/\//);
  });

  it('no public match detail route — no /tournaments/:slug/matches/:matchId endpoint', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/matches\/:matchId/);
    expect(src).not.toMatch(/matchId/);
  });

  it('controller source has no prize, payment, shop, or streaming references', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('controller source has no fake or seed tournament data', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/fake|seed|FAKE|SEED|Dragon Cup/);
  });

  it('module source has no hardcoded domain', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.module.ts'), 'utf8');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  // Slice 5 guardrails: controller is NOT in the core tournaments/ directory
  it('public-tournaments controller lives outside apps/api/src/tournaments/', () => {
    const tournamentDir = join(__dirname, '..', 'tournaments');
    expect(existsSync(join(tournamentDir, 'public-tournaments.controller.ts'))).toBe(false);
    expect(existsSync(join(tournamentDir, 'tournament.controller.ts'))).toBe(false);
  });

  it('controller source has no bracket references', () => {
    const src = readFileSync(join(SRC_DIR, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });
});

// ─── registrationOpen filter semantics ───────────────────────────────────────

describe('registrationOpen filter semantics', () => {
  it('registrationOpen=true passes registrationOpen flag to service', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, 'true');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).toHaveProperty('registrationOpen', true);
  });

  it('registrationOpen=false passes registrationOpen: false to service', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, 'false');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: false }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('registrationOpen=yes omits filter — lenient parser, no 400', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, 'yes');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('registrationOpen');
  });

  it('registrationOpen=1 omits filter — lenient parser, no 400', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, undefined, '1');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('registrationOpen');
  });

  it('registrationOpen absent does not pass registrationOpen to service', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list();

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('registrationOpen');
  });

  it('controller source references no fake registrationOpen counts', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // No hardcoded fake counts injected into response
    expect(src).not.toMatch(/fakeCount|mockCount|registeredCount\s*=\s*\d/);
  });
});

// ─── List / search separation ─────────────────────────────────────────────────

describe('list / search separation', () => {
  it('GET /api/v1/tournaments does not accept q text search parameter', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/@Query\('q'\)/);
    expect(src).not.toMatch(/@Query\('text'\)/);
    expect(src).not.toMatch(/@Query\('search'\)/);
  });

  it('controller source has no search service import', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // list endpoint does not use SearchService — text search is at /api/v1/search/tournaments
    expect(src).not.toMatch(/SearchService/);
  });
});

// ─── Forbidden format values ──────────────────────────────────────────────────

describe('PERMANENT — forbidden format values are never exposed or accepted', () => {
  it('silently drops swiss format filter (swiss is unsupported in Phase 1)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, 'swiss');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('silently drops double_elimination format filter (unsupported in Phase 1)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, 'double_elimination');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('silently drops advanced_bracket_editor format filter (unsupported in Phase 1)', async () => {
    const svc = makeMockService();
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    await ctrl.list(undefined, undefined, undefined, undefined, 'advanced_bracket_editor');

    const callFilter = (svc.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('controller source VALID_FORMATS set does not include swiss', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // The VALID_FORMATS set must not admit swiss
    expect(src).not.toMatch(/'swiss'/);
  });

  it('controller source VALID_FORMATS set does not include double_elimination', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/'double_elimination'/);
  });

  it('controller source does not expose advanced_bracket_editor', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/advanced_bracket_editor/);
  });
});

// ─── Cancelled visibility policy ─────────────────────────────────────────────

describe('PERMANENT — cancelled visibility policy (never remove)', () => {
  it('cancelled tournament is visible via list (transparency policy)', async () => {
    const doc = makeDoc({ status: 'cancelled', cancelledAt: new Date() });
    const svc = makeMockService({
      list: jest.fn().mockResolvedValue({ items: [doc], total: 1 }),
    });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    // When status='cancelled' filter is explicit, service is called with it
    await ctrl.list(undefined, undefined, undefined, 'cancelled');

    expect(svc.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('cancelled is included in default public statuses (visible without explicit filter)', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // PUBLIC_SAFE_STATUSES_ARRAY used for default listing must include cancelled
    expect(src).toContain("'cancelled'");
  });

  it('cancelled detail is returned (not 404) when tournament is cancelled but not deleted', async () => {
    const doc = makeDoc({ status: 'cancelled', cancelledAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = await ctrl.getBySlug('dragon-cup-2026');
    expect(result.status).toBe('cancelled');
  });

  it('cancelled detail does not expose cancelledAt timestamp', async () => {
    const doc = makeDoc({ status: 'cancelled', cancelledAt: new Date() });
    const svc = makeMockService({ findBySlug: jest.fn().mockResolvedValue(doc) });
    const ctrl = new PublicTournamentsController(svc as unknown as TournamentService, noopEnrichmentService);

    const result = (await ctrl.getBySlug('dragon-cup-2026')) as unknown as Record<string, unknown>;
    expect(result).not.toHaveProperty('cancelledAt');
  });

  it('draft is never in PUBLIC_SAFE_STATUSES (never visible)', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    // PUBLIC_SAFE_STATUSES set must not include draft
    const safeSetMatch =
      src.match(/PUBLIC_SAFE_STATUSES\s*=\s*new Set[\s\S]*?\]\)/)?.[0] ??
      src.match(/PUBLIC_SAFE_STATUSES[^=]*=[\s\S]*?\]/)?.[0] ??
      '';
    expect(safeSetMatch).not.toContain("'draft'");
  });

  it('archived is never in PUBLIC_SAFE_STATUSES (never visible)', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    const safeSetMatch =
      src.match(/PUBLIC_SAFE_STATUSES\s*=\s*new Set[\s\S]*?\]\)/)?.[0] ??
      src.match(/PUBLIC_SAFE_STATUSES[^=]*=[\s\S]*?\]/)?.[0] ??
      '';
    expect(safeSetMatch).not.toContain("'archived'");
  });
});

// ─── archivedAt list exclusion (Task 8.4 closeout) ───────────────────────────

describe('PERMANENT — archivedAt exclusion in list query (never remove)', () => {
  it('repository source excludes archivedAt by default in list query', () => {
    const src = readFileSync(join(__dirname, '../tournaments/tournament.repository.ts'), 'utf8');
    expect(src).toMatch(/archivedAt.*\$exists.*false/);
  });

  it('repository source gates archivedAt exclusion on includeArchived flag (mirrors includeDeleted)', () => {
    const src = readFileSync(join(__dirname, '../tournaments/tournament.repository.ts'), 'utf8');
    expect(src).toMatch(/includeArchived/);
  });

  it('types source declares includeArchived on TournamentListFilter', () => {
    const src = readFileSync(join(__dirname, '../tournaments/tournament.types.ts'), 'utf8');
    expect(src).toMatch(/includeArchived/);
  });

  it('public controller does not pass includeArchived (default exclusion applies)', () => {
    const src = readFileSync(join(__dirname, 'public-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/includeArchived/);
  });

  it('archivedAt exclusion is alongside deletedAt exclusion (both present in list method)', () => {
    const src = readFileSync(join(__dirname, '../tournaments/tournament.repository.ts'), 'utf8');
    expect(src).toMatch(/includeDeleted/);
    expect(src).toMatch(/includeArchived/);
  });
});
