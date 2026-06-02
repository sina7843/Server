/**
 * Task 7.1 guardrails — Tournament Match backend domain.
 *
 * Permanent guardrails (never remove):
 *   - No result/standing/bracket logic in match domain files
 *   - No bye match status
 *   - No prize/payment/shop fields in match schema
 *   - No hardcoded localhost or qesb.ir in match source files
 *   - No fake/seed match data
 *   - Admin match controller uses Permissions.* constants (no raw strings)
 *   - Audit calls are fire-and-forget (void)
 *   - No /api/v1/tournaments/:slug/matches/:matchId (public match detail forbidden)
 *   - No Swiss or Double Elimination generation
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const MATCH_DIR = join(__dirname);
const ADMIN_MATCH_DIR = join(__dirname, '../admin/tournament-matches');

function read(file: string): string {
  return readFileSync(join(MATCH_DIR, file), 'utf8');
}

function readAdmin(file: string): string {
  return readFileSync(join(ADMIN_MATCH_DIR, file), 'utf8');
}

// ─── Required files exist ─────────────────────────────────────────────────────

describe('required match domain files exist', () => {
  it('tournament-match.schema.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match.schema.ts'))).toBe(true);
  });

  it('tournament-match.service.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match.service.ts'))).toBe(true);
  });

  it('tournament-match.repository.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match.repository.ts'))).toBe(true);
  });

  it('tournament-match-policy.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match-policy.ts'))).toBe(true);
  });

  it('tournament-match-generation.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match-generation.ts'))).toBe(true);
  });

  it('tournament-match-projection.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match-projection.ts'))).toBe(true);
  });

  it('public-tournament-matches.controller.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'public-tournament-matches.controller.ts'))).toBe(true);
  });

  it('admin-tournament-matches.controller.ts exists', () => {
    expect(existsSync(join(ADMIN_MATCH_DIR, 'admin-tournament-matches.controller.ts'))).toBe(true);
  });
});

// ─── PERMANENT: No result/standing/bracket logic ──────────────────────────────

describe('PERMANENT — no result/standing/bracket logic in match domain', () => {
  it('match service has no result recording logic', () => {
    const src = read('tournament-match.service.ts');
    expect(src).not.toMatch(/ResultService|ResultRepository|recordResult|voidResult/);
    expect(src).not.toMatch(/StandingService|StandingRepository|calculateStanding/);
  });

  it('match schema has no bracket projection fields', () => {
    const src = read('tournament-match.schema.ts');
    expect(src).not.toMatch(/bracketPosition|nextMatchId|bracket/);
  });

  it('match generation has no Swiss implementation', () => {
    const src = read('tournament-match-generation.ts');
    expect(src).not.toMatch(/swiss|Swiss/);
  });

  it('match generation has no Double Elimination implementation', () => {
    const src = read('tournament-match-generation.ts');
    expect(src).not.toMatch(/doubleElimination|double_elimination|losers.*bracket/i);
  });
});

// ─── PERMANENT: No bye match status ──────────────────────────────────────────

describe('PERMANENT — no bye match status', () => {
  it('match schema does not include bye in status enum', () => {
    const src = read('tournament-match.schema.ts');
    expect(src).not.toContain("'bye'");
    expect(src).not.toContain('"bye"');
  });

  it('match policy does not reference bye status', () => {
    const src = read('tournament-match-policy.ts');
    expect(src).not.toMatch(/['"]bye['"]/);
  });
});

// ─── PERMANENT: No prize/payment/shop fields ──────────────────────────────────

describe('PERMANENT — no prize/payment/shop in match domain', () => {
  it('match schema has no prize/payment/shop', () => {
    const src = read('tournament-match.schema.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('match service has no prize/payment/shop', () => {
    const src = read('tournament-match.service.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in match source', () => {
  const files = [
    'tournament-match.schema.ts',
    'tournament-match.service.ts',
    'tournament-match.repository.ts',
    'tournament-match-policy.ts',
    'tournament-match-generation.ts',
    'tournament-match-projection.ts',
    'public-tournament-matches.controller.ts',
  ];

  for (const file of files) {
    it(`${file} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(file);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }

  it('admin-tournament-matches.controller.ts has no hardcoded localhost or qesb.ir', () => {
    const src = readAdmin('admin-tournament-matches.controller.ts');
    expect(src).not.toMatch(/localhost/);
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── PERMANENT: No fake/seed match data ──────────────────────────────────────

describe('PERMANENT — no fake or seed match data', () => {
  it('match service has no fake data', () => {
    const src = read('tournament-match.service.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('no match seed file exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match-seed.ts'))).toBe(false);
    expect(existsSync(join(MATCH_DIR, 'seeds'))).toBe(false);
  });
});

// ─── PERMANENT: Admin controller uses Permissions.* ──────────────────────────

describe('PERMANENT — admin match controller uses Permissions.* constants', () => {
  it('uses Permissions.TOURNAMENT_MATCH_READ and TOURNAMENT_MATCH_MANAGE', () => {
    const src = readAdmin('admin-tournament-matches.controller.ts');
    expect(src).toContain('Permissions.TOURNAMENT_MATCH_READ');
    expect(src).toContain('Permissions.TOURNAMENT_MATCH_MANAGE');
  });

  it('does not use raw permission strings', () => {
    const src = readAdmin('admin-tournament-matches.controller.ts');
    expect(src).not.toMatch(/'tournament\.match\.(read|manage)'/);
    expect(src).not.toMatch(/"tournament\.match\.(read|manage)"/);
  });
});

// ─── PERMANENT: Audit calls are fire-and-forget ───────────────────────────────

describe('PERMANENT — audit calls are fire-and-forget in match service', () => {
  it('uses void this.auditService?.log pattern', () => {
    const src = read('tournament-match.service.ts');
    expect(src).toContain('void this.auditService?.log');
  });
});

// ─── PERMANENT: No public match detail route ──────────────────────────────────

describe('PERMANENT — no public match detail endpoint (/matches/:matchId)', () => {
  it('public controller does not define :matchId route', () => {
    const src = read('public-tournament-matches.controller.ts');
    expect(src).not.toMatch(/matches\/:matchId|matches\/:id/);
    expect(src).not.toMatch(/@Get\(['"]:.*matchId/);
    expect(src).not.toMatch(/@Get\(['"]:.*id['"]\)/);
  });

  it('public controller only exposes GET list endpoint', () => {
    const src = read('public-tournament-matches.controller.ts');
    expect(src).toContain("@Get(':slug/matches')");
  });
});

// ─── PERMANENT: Match generation policy constraints ──────────────────────────

describe('PERMANENT — match generation policy constraints', () => {
  it('policy allows generation only for registration_closed and in_progress', () => {
    const src = read('tournament-match-policy.ts');
    expect(src).toContain('registration_closed');
    expect(src).toContain('in_progress');
  });

  it('policy only allows single_elimination and round_robin for generation', () => {
    const src = read('tournament-match-policy.ts');
    expect(src).toContain('single_elimination');
    expect(src).toContain('round_robin');
    expect(src).not.toMatch(/'swiss'|"swiss"/);
    expect(src).not.toMatch(/'double_elimination'|"double_elimination"/);
  });
});
