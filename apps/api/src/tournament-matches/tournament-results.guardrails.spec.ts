/**
 * Task 7.2 guardrails — Tournament Result backend domain.
 *
 * Permanent guardrails (never remove):
 *   - Result is embedded in TournamentMatch (no separate collection/model)
 *   - No standings calculation in result domain files
 *   - No bracket projection in result domain files
 *   - No public result detail/mutation route
 *   - No public match detail route (/api/v1/tournaments/:slug/matches/:matchId)
 *   - No live scoring / WebSocket scoreboard
 *   - No fake results or runtime demo data
 *   - No prize/payment/shop fields in result DTOs or service
 *   - Admin result controller uses Permissions.TOURNAMENT_RESULT_MANAGE
 *   - Audit calls are fire-and-forget (void)
 *   - No hardcoded localhost or qesb.ir in result domain files
 *   - result.voided moves match back to scheduled (void policy documented)
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const MATCH_DIR = join(__dirname);
const ADMIN_RESULT_DIR = join(__dirname, '../admin/tournament-results');
const PUBLIC_MATCH_CONTROLLER = join(MATCH_DIR, 'public-tournament-matches.controller.ts');

function read(file: string): string {
  return readFileSync(join(MATCH_DIR, file), 'utf8');
}

function readAdmin(file: string): string {
  return readFileSync(join(ADMIN_RESULT_DIR, file), 'utf8');
}

// ─── Required files exist ─────────────────────────────────────────────────────

describe('required result domain files exist', () => {
  it('tournament-result-policy.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-result-policy.ts'))).toBe(true);
  });

  it('tournament-result-projection.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-result-projection.ts'))).toBe(true);
  });

  it('tournament-result.service.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-result.service.ts'))).toBe(true);
  });

  it('dto/result-body.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'dto', 'result-body.ts'))).toBe(true);
  });

  it('admin-tournament-results.controller.ts exists', () => {
    expect(existsSync(join(ADMIN_RESULT_DIR, 'admin-tournament-results.controller.ts'))).toBe(true);
  });
});

// ─── PERMANENT: Result is embedded (no separate collection) ──────────────────

describe('PERMANENT — result is embedded in TournamentMatch (no separate collection)', () => {
  it('no separate TournamentMatchResult schema file exists', () => {
    expect(existsSync(join(MATCH_DIR, 'tournament-match-result.schema.ts'))).toBe(false);
    expect(existsSync(join(MATCH_DIR, 'tournament-result.schema.ts'))).toBe(false);
  });

  it('no tournament-results collection exists', () => {
    expect(existsSync(join(__dirname, '../tournament-results'))).toBe(false);
  });

  it('result service operates on TournamentMatchRepository', () => {
    const src = read('tournament-result.service.ts');
    expect(src).toContain('TournamentMatchRepository');
  });

  it('result projection operates on TournamentMatchDocument', () => {
    const src = read('tournament-result-projection.ts');
    expect(src).toContain('TournamentMatchDocument');
  });
});

// ─── PERMANENT: No standings / bracket in result domain ──────────────────────

describe('PERMANENT — no standings or bracket logic in result domain', () => {
  it('result service has no standings calculation', () => {
    const src = read('tournament-result.service.ts');
    expect(src).not.toMatch(/StandingService|calculateStanding|StandingRepository/);
  });

  it('result service has no bracket projection', () => {
    const src = read('tournament-result.service.ts');
    expect(src).not.toMatch(/BracketService|BracketRepository|bracket/i);
  });

  it('result policy has no standings or bracket', () => {
    const src = read('tournament-result-policy.ts');
    expect(src).not.toMatch(/standing|Standing|bracket|Bracket/i);
  });
});

// ─── PERMANENT: No public result mutation or detail route ─────────────────────

describe('PERMANENT — no public result mutation or detail route', () => {
  it('public match controller does not define a result endpoint', () => {
    const src = readFileSync(PUBLIC_MATCH_CONTROLLER, 'utf8');
    expect(src).not.toMatch(/result/i);
  });

  it('admin result controller does not define a public-facing route', () => {
    const src = readAdmin('admin-tournament-results.controller.ts');
    expect(src).not.toMatch(/@Controller\(['"]api\/v1/);
  });

  it('admin result controller does not define GET :matchId/result (public result detail)', () => {
    const src = readAdmin('admin-tournament-results.controller.ts');
    expect(src).not.toMatch(/@Get\(['"]:.*matchId.*result['"]\)/);
  });
});

// ─── PERMANENT: No public match detail route ──────────────────────────────────

describe('PERMANENT — no public match detail route (/matches/:matchId)', () => {
  it('public match controller has no :matchId detail route', () => {
    const src = readFileSync(PUBLIC_MATCH_CONTROLLER, 'utf8');
    expect(src).not.toMatch(/@Get\(['"]:slug\/matches\/:matchId['"]\)/);
    expect(src).not.toMatch(/matches\/:matchId/);
  });
});

// ─── PERMANENT: No live scoring ───────────────────────────────────────────────

describe('PERMANENT — no live scoring or WebSocket scoreboard', () => {
  it('result service has no WebSocket or live score references', () => {
    const src = read('tournament-result.service.ts');
    expect(src).not.toMatch(/WebSocket|Socket\.io|liveScore|scoreEvent|@WebSocketGateway/);
  });

  it('result policy has no streaming or live score references', () => {
    const src = read('tournament-result-policy.ts');
    expect(src).not.toMatch(/liveScore|stream|WebSocket/i);
  });
});

// ─── PERMANENT: No prize/payment/shop ────────────────────────────────────────

describe('PERMANENT — no prize/payment/shop in result domain', () => {
  it('result service has no prize/payment/shop', () => {
    const src = read('tournament-result.service.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('result body parser has no prize/payment/shop', () => {
    const src = read('dto/result-body.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── PERMANENT: No fake/seed result data ─────────────────────────────────────

describe('PERMANENT — no fake or seed result data', () => {
  it('result service has no fake data', () => {
    const src = read('tournament-result.service.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('no result seed file exists', () => {
    expect(existsSync(join(MATCH_DIR, 'result-seed.ts'))).toBe(false);
    expect(existsSync(join(ADMIN_RESULT_DIR, 'result-seed.ts'))).toBe(false);
  });
});

// ─── PERMANENT: Admin controller uses Permissions.TOURNAMENT_RESULT_MANAGE ───

describe('PERMANENT — admin result controller uses Permissions.TOURNAMENT_RESULT_MANAGE', () => {
  it('uses Permissions.TOURNAMENT_RESULT_MANAGE (not a raw string)', () => {
    const src = readAdmin('admin-tournament-results.controller.ts');
    expect(src).toContain('Permissions.TOURNAMENT_RESULT_MANAGE');
    expect(src).not.toMatch(/'tournament\.result\.manage'/);
    expect(src).not.toMatch(/"tournament\.result\.manage"/);
  });
});

// ─── PERMANENT: Audit calls are fire-and-forget ───────────────────────────────

describe('PERMANENT — audit calls in result service are fire-and-forget', () => {
  it('uses void this.auditService?.log pattern', () => {
    const src = read('tournament-result.service.ts');
    expect(src).toContain('void this.auditService?.log');
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in result domain', () => {
  const files = [
    'tournament-result.service.ts',
    'tournament-result-policy.ts',
    'tournament-result-projection.ts',
    'dto/result-body.ts',
  ];

  for (const file of files) {
    it(`${file} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(file);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }

  it('admin-tournament-results.controller.ts has no hardcoded localhost or qesb.ir', () => {
    const src = readAdmin('admin-tournament-results.controller.ts');
    expect(src).not.toMatch(/localhost/);
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── PERMANENT: Result policy documented ─────────────────────────────────────

describe('PERMANENT — result and void policies are documented in source', () => {
  it('result policy documents in_progress restriction', () => {
    const src = read('tournament-result-policy.ts');
    expect(src).toContain('in_progress');
  });

  it('result service void method clears result and moves to scheduled', () => {
    const src = read('tournament-result.service.ts');
    expect(src).toContain("'scheduled'");
    expect(src).toContain('winnerId: null');
    expect(src).toContain('completedAt: null');
  });

  it('result policy documents winner must be a match participant', () => {
    const src = read('tournament-result-policy.ts');
    expect(src).toContain('participant');
    expect(src).toContain('winner');
  });
});
