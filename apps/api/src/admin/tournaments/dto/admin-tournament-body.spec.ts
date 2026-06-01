/**
 * Body parser unit tests — lifecycle bypass prevention and field validation.
 *
 * Verifies that:
 *   - status cannot be set via create or update body
 *   - publishedAt/cancelledAt/archivedAt/deletedAt cannot be set via PATCH
 *   - unknown fields are rejected
 *   - required fields are validated on create
 *   - optional fields work correctly on update
 */

import { BadRequestException } from '@nestjs/common';
import {
  parseAdminCreateTournamentBody,
  parseAdminUpdateTournamentBody,
  parseLifecycleActionBody,
} from './admin-tournament-body';

// ─── Create body — lifecycle bypass prevention ────────────────────────────────

describe('parseAdminCreateTournamentBody — lifecycle bypass prevention', () => {
  const validBase = {
    gameId: '507f1f77bcf86cd799439012',
    title: 'Dragon Cup 2026',
    slug: 'dragon-cup-2026',
    format: 'single_elimination',
    capacity: 64,
  };

  it('rejects status field in create body', () => {
    expect(() => parseAdminCreateTournamentBody({ ...validBase, status: 'published' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects publishedAt field in create body', () => {
    expect(() =>
      parseAdminCreateTournamentBody({ ...validBase, publishedAt: '2026-01-01T00:00:00Z' }),
    ).toThrow(BadRequestException);
  });

  it('rejects cancelledAt field in create body', () => {
    expect(() =>
      parseAdminCreateTournamentBody({ ...validBase, cancelledAt: '2026-01-01T00:00:00Z' }),
    ).toThrow(BadRequestException);
  });

  it('rejects archivedAt field in create body', () => {
    expect(() =>
      parseAdminCreateTournamentBody({ ...validBase, archivedAt: '2026-01-01T00:00:00Z' }),
    ).toThrow(BadRequestException);
  });

  it('rejects deletedAt field in create body', () => {
    expect(() =>
      parseAdminCreateTournamentBody({ ...validBase, deletedAt: '2026-01-01T00:00:00Z' }),
    ).toThrow(BadRequestException);
  });

  it('lifecycle bypass error message mentions lifecycle endpoints', () => {
    try {
      parseAdminCreateTournamentBody({ ...validBase, status: 'draft' });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).message).toMatch(/lifecycle/i);
    }
  });
});

// ─── Update body — lifecycle bypass prevention ────────────────────────────────

describe('parseAdminUpdateTournamentBody — lifecycle bypass prevention', () => {
  it('rejects status in PATCH body', () => {
    expect(() => parseAdminUpdateTournamentBody({ status: 'published' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects publishedAt in PATCH body', () => {
    expect(() => parseAdminUpdateTournamentBody({ publishedAt: '2026-01-01T00:00:00Z' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects cancelledAt in PATCH body', () => {
    expect(() => parseAdminUpdateTournamentBody({ cancelledAt: '2026-01-01T00:00:00Z' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects archivedAt in PATCH body', () => {
    expect(() => parseAdminUpdateTournamentBody({ archivedAt: '2026-01-01T00:00:00Z' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects deletedAt in PATCH body (soft-delete bypass prevention)', () => {
    expect(() => parseAdminUpdateTournamentBody({ deletedAt: '2026-01-01T00:00:00Z' })).toThrow(
      BadRequestException,
    );
  });

  it('lifecycle bypass error message mentions lifecycle endpoints', () => {
    try {
      parseAdminUpdateTournamentBody({ status: 'archived' });
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).message).toMatch(/lifecycle/i);
    }
  });

  it('rejects unknown fields', () => {
    expect(() => parseAdminUpdateTournamentBody({ unknownField: 'x' })).toThrow(
      BadRequestException,
    );
  });

  it('accepts allowed fields: title, format, capacity, description, rules', () => {
    expect(() =>
      parseAdminUpdateTournamentBody({ title: 'New Title', capacity: 32 }),
    ).not.toThrow();
  });

  it('accepts empty object (no-op update)', () => {
    expect(() => parseAdminUpdateTournamentBody({})).not.toThrow();
  });

  it('accepts optional date fields', () => {
    expect(() =>
      parseAdminUpdateTournamentBody({
        registrationOpenAt: '2026-06-01T00:00:00Z',
        startsAt: '2026-07-01T00:00:00Z',
      }),
    ).not.toThrow();
  });
});

// ─── Create body — required field validation ─────────────────────────────────

describe('parseAdminCreateTournamentBody — required field validation', () => {
  it('rejects body without gameId', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        title: 'Cup',
        slug: 'cup',
        format: 'single_elimination',
        capacity: 64,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects body without title', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        slug: 'cup',
        format: 'single_elimination',
        capacity: 64,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects body without slug', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        title: 'Cup',
        format: 'single_elimination',
        capacity: 64,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects body without format', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        title: 'Cup',
        slug: 'cup',
        capacity: 64,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects body without capacity', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        title: 'Cup',
        slug: 'cup',
        format: 'single_elimination',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects non-integer capacity', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        title: 'Cup',
        slug: 'cup',
        format: 'single_elimination',
        capacity: 32.5,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown fields', () => {
    expect(() =>
      parseAdminCreateTournamentBody({
        gameId: '507f1f77bcf86cd799439012',
        title: 'Cup',
        slug: 'cup',
        format: 'single_elimination',
        capacity: 64,
        unknownField: 'x',
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts valid minimum body', () => {
    const result = parseAdminCreateTournamentBody({
      gameId: '507f1f77bcf86cd799439012',
      title: 'Dragon Cup 2026',
      slug: 'dragon-cup-2026',
      format: 'single_elimination',
      capacity: 64,
    });
    expect(result.gameId).toBe('507f1f77bcf86cd799439012');
    expect(result.title).toBe('Dragon Cup 2026');
    expect(result.slug).toBe('dragon-cup-2026');
    expect(result.format).toBe('single_elimination');
    expect(result.capacity).toBe(64);
  });
});

// ─── Lifecycle action body ────────────────────────────────────────────────────

describe('parseLifecycleActionBody', () => {
  it('accepts empty body', () => {
    expect(parseLifecycleActionBody({})).toEqual({});
  });

  it('accepts body with reason', () => {
    expect(parseLifecycleActionBody({ reason: 'Compliance' })).toEqual({ reason: 'Compliance' });
  });

  it('accepts null/undefined body', () => {
    expect(parseLifecycleActionBody(null)).toEqual({});
    expect(parseLifecycleActionBody(undefined)).toEqual({});
  });

  it('rejects unknown fields', () => {
    expect(() => parseLifecycleActionBody({ reason: 'ok', extra: 'bad' })).toThrow(
      BadRequestException,
    );
  });
});
