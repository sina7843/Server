/**
 * Task 7.3 guardrails — Tournament Standings backend domain.
 *
 * Permanent guardrails (never remove):
 *   - No permanent standings collection
 *   - Standings are projection-based (no schema/model file)
 *   - No fake standings
 *   - No live scoring / WebSocket
 *   - No prize/payment/shop fields
 *   - No public result detail/mutation route
 *   - No public match detail route
 *   - Admin controller uses Permissions.TOURNAMENT_MATCH_READ for GET
 *   - Admin controller uses Permissions.TOURNAMENT_RESULT_MANAGE for recalculate
 *   - No hardcoded localhost or qesb.ir
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const STANDINGS_DIR = join(__dirname);
const ADMIN_STANDINGS_DIR = join(__dirname, '../admin/tournament-standings');

function read(file: string): string {
  return readFileSync(join(STANDINGS_DIR, file), 'utf8');
}

function readAdmin(file: string): string {
  return readFileSync(join(ADMIN_STANDINGS_DIR, file), 'utf8');
}

// ─── Required files exist ─────────────────────────────────────────────────────

describe('required standings domain files exist', () => {
  it('tournament-standings.service.ts exists', () => {
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standings.service.ts'))).toBe(true);
  });

  it('tournament-standings.module.ts exists', () => {
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standings.module.ts'))).toBe(true);
  });

  it('public-tournament-standings.controller.ts exists', () => {
    expect(existsSync(join(STANDINGS_DIR, 'public-tournament-standings.controller.ts'))).toBe(true);
  });

  it('admin-tournament-standings.controller.ts exists', () => {
    expect(existsSync(join(ADMIN_STANDINGS_DIR, 'admin-tournament-standings.controller.ts'))).toBe(
      true,
    );
  });
});

// ─── PERMANENT: No standings collection ───────────────────────────────────────

describe('PERMANENT — no permanent standings collection', () => {
  it('no tournament-standings schema file exists', () => {
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standings.schema.ts'))).toBe(false);
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standing.schema.ts'))).toBe(false);
  });

  it('service does not reference a TournamentStandings model', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/@InjectModel\(['"]TournamentStanding/);
    expect(src).not.toMatch(/tournamentStandings\.find/);
  });

  it('standings service operates on TournamentMatchRepository', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('TournamentMatchRepository');
  });
});

// ─── PERMANENT: Projection-based ─────────────────────────────────────────────

describe('PERMANENT — standings are projection-based', () => {
  it('service comment documents projection-based approach', () => {
    const src = read('tournament-standings.service.ts');
    expect(src.toLowerCase()).toMatch(/projection/);
  });

  it('getStandings returns computed result from matches', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('getStandings');
    expect(src).toContain('computeStandings');
  });

  it('recalculate method exists and emits audit', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('recalculate');
    expect(src).toContain('STANDINGS_RECALCULATED');
  });

  it('audit call is fire-and-forget (void)', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('void this.auditService?.log');
  });
});

// ─── PERMANENT: Policy documentation ─────────────────────────────────────────

describe('PERMANENT — standings policy is documented in source', () => {
  it('round_robin policy is documented', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('round_robin');
  });

  it('single_elimination policy is documented', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('single_elimination');
  });

  it('manual policy is documented (empty standings)', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).toContain('manual');
  });
});

// ─── PERMANENT: No fake standings ─────────────────────────────────────────────

describe('PERMANENT — no fake standings data', () => {
  it('service has no fake data', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });
});

// ─── PERMANENT: No live scoring / WebSocket ───────────────────────────────────

describe('PERMANENT — no live scoring or WebSocket in standings', () => {
  it('service has no WebSocket or live score references', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/WebSocket|Socket\.io|liveScore|scoreEvent|@WebSocketGateway/);
  });

  it('public controller has no live or stream references', () => {
    const src = read('public-tournament-standings.controller.ts');
    expect(src).not.toMatch(/liveScore|stream|WebSocket/i);
  });
});

// ─── PERMANENT: No prize/payment/shop ────────────────────────────────────────

describe('PERMANENT — no prize/payment/shop in standings domain', () => {
  it('service has no prize/payment/shop', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── PERMANENT: Admin controller permissions ──────────────────────────────────

describe('PERMANENT — admin standings controller uses correct permissions', () => {
  it('GET standings uses Permissions.TOURNAMENT_MATCH_READ', () => {
    const src = readAdmin('admin-tournament-standings.controller.ts');
    expect(src).toContain('Permissions.TOURNAMENT_MATCH_READ');
    expect(src).not.toMatch(/'tournament\.match\.read'/);
  });

  it('POST recalculate uses Permissions.TOURNAMENT_RESULT_MANAGE', () => {
    const src = readAdmin('admin-tournament-standings.controller.ts');
    expect(src).toContain('Permissions.TOURNAMENT_RESULT_MANAGE');
    expect(src).not.toMatch(/'tournament\.result\.manage'/);
  });

  it('admin controller does not define a public-facing route', () => {
    const src = readAdmin('admin-tournament-standings.controller.ts');
    expect(src).not.toMatch(/@Controller\(['"]api\/v1/);
  });
});

// ─── PERMANENT: No Swiss / Double Elimination ────────────────────────────────

describe('PERMANENT — no Swiss or Double Elimination logic', () => {
  it('service has no Swiss implementation', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/swiss|Swiss/);
  });

  it('service has no Double Elimination logic', () => {
    const src = read('tournament-standings.service.ts');
    expect(src).not.toMatch(/doubleElim|double_elim|DoubleElimination/i);
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in standings domain', () => {
  const files = [
    'tournament-standings.service.ts',
    'tournament-standings.module.ts',
    'public-tournament-standings.controller.ts',
  ];

  for (const file of files) {
    it(`${file} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(file);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }

  it('admin-tournament-standings.controller.ts has no hardcoded origins', () => {
    const src = readAdmin('admin-tournament-standings.controller.ts');
    expect(src).not.toMatch(/localhost/);
    expect(src).not.toMatch(/qesb\.ir/);
  });
});
