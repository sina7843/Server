import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import {
  isPubliclyVisible,
  toPublicTournamentSummary,
  toPublicTournamentDetail,
  toAdminTournamentDto,
} from './tournament-projection';
import type { TournamentDocument } from './tournament.schema';

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

// ─── isPubliclyVisible ────────────────────────────────────────────────────────

describe('isPubliclyVisible', () => {
  it('returns false for draft status', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'draft' }))).toBe(false);
  });

  it('returns false for archived status', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'archived' }))).toBe(false);
  });

  it('returns false when deletedAt is set', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'published', deletedAt: new Date() }))).toBe(false);
  });

  it('returns true for published', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'published' }))).toBe(true);
  });

  it('returns true for registration_open', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'registration_open' }))).toBe(true);
  });

  it('returns true for registration_closed', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'registration_closed' }))).toBe(true);
  });

  it('returns true for in_progress', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'in_progress' }))).toBe(true);
  });

  it('returns true for completed', () => {
    expect(isPubliclyVisible(makeDoc({ status: 'completed' }))).toBe(true);
  });

  it('does not use a visibility field — only status and deletedAt', () => {
    const src = readFileSync(join(__dirname, 'tournament-projection.ts'), 'utf8');
    expect(src).not.toMatch(/\.visibility\b/);
    expect(src).not.toMatch(/isVisible\b/);
  });
});

// ─── toPublicTournamentSummary ────────────────────────────────────────────────

describe('toPublicTournamentSummary', () => {
  it('includes required fields', () => {
    const dto = toPublicTournamentSummary(makeDoc());
    expect(dto.id).toBe('507f1f77bcf86cd799439011');
    expect(dto.gameId).toBe('507f1f77bcf86cd799439012');
    expect(dto.title).toBe('Dragon Cup 2026');
    expect(dto.slug).toBe('dragon-cup-2026');
    expect(dto.format).toBe('single_elimination');
    expect(dto.status).toBe('published');
    expect(dto.capacity).toBe(64);
  });

  it('includes startsAt when set', () => {
    const startsAt = new Date('2026-03-01T00:00:00Z');
    const dto = toPublicTournamentSummary(makeDoc({ startsAt }));
    expect(dto.startsAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('includes publishedAt when set', () => {
    const publishedAt = new Date('2026-01-10T00:00:00Z');
    const dto = toPublicTournamentSummary(makeDoc({ publishedAt }));
    expect(dto.publishedAt).toBe('2026-01-10T00:00:00.000Z');
  });

  it('excludes cancelledAt (not in public summary DTO)', () => {
    const dto = toPublicTournamentSummary(makeDoc({ cancelledAt: new Date() }));
    expect('cancelledAt' in dto).toBe(false);
  });

  it('excludes deletedAt', () => {
    const dto = toPublicTournamentSummary(makeDoc({ deletedAt: new Date() }));
    expect('deletedAt' in dto).toBe(false);
  });

  it('excludes slugNormalized (internal persistence field)', () => {
    const dto = toPublicTournamentSummary(makeDoc());
    expect('slugNormalized' in dto).toBe(false);
  });

  it('excludes participantType (internal persistence field)', () => {
    const dto = toPublicTournamentSummary(makeDoc());
    expect('participantType' in dto).toBe(false);
  });

  it('excludes description', () => {
    const dto = toPublicTournamentSummary(makeDoc({ description: 'A big cup' }));
    expect('description' in dto).toBe(false);
  });
});

// ─── toPublicTournamentDetail ─────────────────────────────────────────────────

describe('toPublicTournamentDetail', () => {
  it('includes required fields', () => {
    const dto = toPublicTournamentDetail(makeDoc());
    expect(dto.id).toBe('507f1f77bcf86cd799439011');
    expect(dto.gameId).toBe('507f1f77bcf86cd799439012');
    expect(dto.title).toBe('Dragon Cup 2026');
    expect(dto.slug).toBe('dragon-cup-2026');
    expect(dto.format).toBe('single_elimination');
    expect(dto.status).toBe('published');
    expect(dto.capacity).toBe(64);
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('includes description when set', () => {
    const dto = toPublicTournamentDetail(makeDoc({ description: 'The biggest cup' }));
    expect(dto.description).toBe('The biggest cup');
  });

  it('includes registrationOpenAt and registrationCloseAt when set', () => {
    const doc = makeDoc({
      registrationOpenAt: new Date('2026-02-01T00:00:00Z'),
      registrationCloseAt: new Date('2026-02-15T00:00:00Z'),
    });
    const dto = toPublicTournamentDetail(doc);
    expect(dto.registrationOpenAt).toBe('2026-02-01T00:00:00.000Z');
    expect(dto.registrationCloseAt).toBe('2026-02-15T00:00:00.000Z');
  });

  it('excludes cancelledAt (admin-only field)', () => {
    const dto = toPublicTournamentDetail(makeDoc({ cancelledAt: new Date() }));
    expect('cancelledAt' in dto).toBe(false);
  });

  it('excludes deletedAt', () => {
    const dto = toPublicTournamentDetail(makeDoc({ deletedAt: new Date() }));
    expect('deletedAt' in dto).toBe(false);
  });

  it('excludes slugNormalized', () => {
    const dto = toPublicTournamentDetail(makeDoc());
    expect('slugNormalized' in dto).toBe(false);
  });

  it('excludes participantType', () => {
    const dto = toPublicTournamentDetail(makeDoc());
    expect('participantType' in dto).toBe(false);
  });
});

// ─── toAdminTournamentDto ─────────────────────────────────────────────────────

describe('toAdminTournamentDto', () => {
  it('includes all standard fields', () => {
    const dto = toAdminTournamentDto(makeDoc());
    expect(dto.id).toBe('507f1f77bcf86cd799439011');
    expect(dto.gameId).toBe('507f1f77bcf86cd799439012');
    expect(dto.title).toBe('Dragon Cup 2026');
    expect(dto.slug).toBe('dragon-cup-2026');
    expect(dto.format).toBe('single_elimination');
    expect(dto.status).toBe('published');
    expect(dto.capacity).toBe(64);
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('includes cancelledAt when set', () => {
    const cancelledAt = new Date('2026-04-01T00:00:00Z');
    const dto = toAdminTournamentDto(makeDoc({ cancelledAt }));
    expect(dto.cancelledAt).toBe('2026-04-01T00:00:00.000Z');
  });

  it('omits cancelledAt when not set', () => {
    const dto = toAdminTournamentDto(makeDoc());
    expect('cancelledAt' in dto).toBe(false);
  });

  it('excludes deletedAt (not in admin DTO contract)', () => {
    const dto = toAdminTournamentDto(makeDoc({ deletedAt: new Date() }));
    expect('deletedAt' in dto).toBe(false);
  });

  it('excludes slugNormalized', () => {
    const dto = toAdminTournamentDto(makeDoc());
    expect('slugNormalized' in dto).toBe(false);
  });

  it('excludes participantType', () => {
    const dto = toAdminTournamentDto(makeDoc());
    expect('participantType' in dto).toBe(false);
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('tournament-projection scope guardrails', () => {
  it('projection source has no bracket references', () => {
    const src = readFileSync(join(__dirname, 'tournament-projection.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('projection source has no prize, payment, shop, or streaming fields', () => {
    const src = readFileSync(join(__dirname, 'tournament-projection.ts'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('projection source has no visibility field', () => {
    const src = readFileSync(join(__dirname, 'tournament-projection.ts'), 'utf8');
    expect(src).not.toMatch(/visibility\s*:/);
  });

  it('no external tournament CRUD controller exists', () => {
    expect(existsSync(join(__dirname, 'tournament.controller.ts'))).toBe(false);
  });

  it('no fake tournament seed data file exists', () => {
    expect(existsSync(join(__dirname, 'tournament-seed.ts'))).toBe(false);
    expect(existsSync(join(__dirname, 'seeds'))).toBe(false);
  });

  it('policy source has no future format implementations', () => {
    const src = readFileSync(join(__dirname, 'tournament-policy.ts'), 'utf8');
    expect(src).not.toMatch(/swiss.*pairing|doubleElim|bracketEditor/i);
  });

  it('policy source has no hardcoded localhost or domain', () => {
    const src = readFileSync(join(__dirname, 'tournament-policy.ts'), 'utf8');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});
