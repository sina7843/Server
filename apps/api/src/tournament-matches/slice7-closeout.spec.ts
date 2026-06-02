/**
 * Slice 7 closeout hardening — Match, Result, Standings, and Bracket domain.
 *
 * Permanent guardrails (never remove):
 *   - No public match detail route (/api/v1/tournaments/:slug/matches/:matchId)
 *   - No public result detail route or mutation route
 *   - No bracket collection/schema/model/persistence
 *   - No independent bracket nodes stored separately from matches
 *   - No editable bracket state or advanced bracket editor
 *   - No live scoring / WebSocket scoreboard
 *   - No Swiss / Double Elimination implementation
 *   - No permanent standings collection (projection-based only)
 *   - No fake operational data (matches/results/standings/bracket)
 *   - Admin controllers use centralized Permissions.* constants
 *   - Audit action names are exact
 *   - Analytics event names are exact
 *   - No hardcoded localhost or qesb.ir in runtime code
 *   - Admin bracket SDK method is admin.tournaments.getBracket() — sole method, no competing client
 *
 * Temporary Slice-7 checks (clearly labeled — remove when feature slice lands):
 *   - No public frontend matches page (/tournaments/:slug/matches) → remove when Slice 9 lands
 *   - No public frontend results page (/tournaments/:slug/results) → remove when Slice 9 lands
 *   - No public frontend standings page (/tournaments/:slug/standings) → remove when Slice 9 lands
 *   - No public frontend bracket page (/tournaments/:slug/bracket) → remove when Slice 9 lands
 *   - No admin frontend matches page (/tournaments/:id/matches) → remove when Slice 10 lands
 *   - No admin frontend results page (/tournaments/:id/results) → remove when Slice 10 lands
 *   - No admin frontend standings page (/tournaments/:id/standings) → remove when Slice 10 lands
 *   - No admin frontend bracket page (/tournaments/:id/bracket) → remove when Slice 10 lands
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const API_SRC = join(__dirname, '..');
const MATCH_DIR = join(__dirname);
const STANDINGS_DIR = join(API_SRC, 'tournament-standings');
const BRACKET_DIR = join(API_SRC, 'tournament-bracket');
const ADMIN_MATCH_DIR = join(API_SRC, 'admin/tournament-matches');
const ADMIN_RESULT_DIR = join(API_SRC, 'admin/tournament-results');
const ADMIN_STANDINGS_DIR = join(API_SRC, 'admin/tournament-standings');
const ADMIN_BRACKET_DIR = join(API_SRC, 'admin/tournament-bracket');

const REPO_ROOT = join(API_SRC, '../../..');
const SDK_SRC = join(REPO_ROOT, 'packages/sdk/src');
const WEB_PAGES = join(REPO_ROOT, 'apps/web/pages');
const ADMIN_PAGES = join(REPO_ROOT, 'apps/admin/pages');

function read(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

// ─── SDK alignment: public tournament methods ─────────────────────────────────

describe('SDK alignment — public tournament methods', () => {
  it('tournaments.ts exports getResults method', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).toContain('getResults');
    expect(src).toContain('/results');
  });

  it('tournaments.ts exports getStandings method', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).toContain('getStandings');
    expect(src).toContain('/standings');
  });

  it('tournaments.ts exports getBracket method', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).toContain('getBracket');
    expect(src).toContain('/bracket');
  });

  it('tournaments.ts exports getMatches method', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).toContain('getMatches');
    expect(src).toContain('/matches');
  });

  it('public SDK has no getMatchById / getResultById methods', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).not.toMatch(/getMatchById|getResultById|getResultDetail/);
  });

  it('public SDK has no result mutation methods', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).not.toMatch(/recordResult|updateResult|voidResult/);
  });

  it('public SDK has no live scoring methods', () => {
    const src = read(join(SDK_SRC, 'tournaments.ts'));
    expect(src).not.toMatch(/liveScore|scoreEvent|WebSocket/);
  });
});

// ─── SDK alignment: admin matches ─────────────────────────────────────────────

describe('SDK alignment — admin tournament matches', () => {
  it('admin-tournament-matches.ts exports list, create, generate, update, cancel', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-matches.ts'));
    expect(src).toContain('list');
    expect(src).toContain('create');
    expect(src).toContain('generate');
    expect(src).toContain('update');
    expect(src).toContain('cancel');
  });

  it('generate calls POST /admin/v1/tournaments/:id/matches/generate', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-matches.ts'));
    expect(src).toContain('/matches/generate');
  });
});

// ─── SDK alignment: admin results ─────────────────────────────────────────────

describe('SDK alignment — admin tournament results', () => {
  it('admin-tournament-results.ts exports record, update, void', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-results.ts'));
    expect(src).toContain('record');
    expect(src).toContain('update');
    expect(src).toContain('void');
  });

  it('void calls POST .../result/void (not DELETE)', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-results.ts'));
    expect(src).toContain('/result/void');
    expect(src).toContain("method: 'POST'");
  });
});

// ─── SDK alignment: admin standings ───────────────────────────────────────────

describe('SDK alignment — admin tournament standings', () => {
  it('admin-tournament-standings.ts exports get and recalculate', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-standings.ts'));
    expect(src).toContain('get(');
    expect(src).toContain('recalculate(');
  });

  it('recalculate calls POST /admin/v1/tournaments/:id/standings/recalculate', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-standings.ts'));
    expect(src).toContain('/standings/recalculate');
  });

  it('standings client has no getStandings alias', () => {
    const src = read(join(SDK_SRC, 'admin-tournament-standings.ts'));
    expect(src).not.toMatch(/\bgetStandings\b|\bcalculateStandings\b|\bcomputeStandings\b/);
  });
});

// ─── SDK alignment: admin bracket — sole method on admin.tournaments ─────────
//
// Admin bracket SDK decision (Slice 7 closeout):
//   admin.tournaments.getBracket(tournamentId) is the sole admin bracket method.
//   No competing createAdminTournamentBracketClient.get() exists.
//   Bracket is a projection — not an independent resource.

describe('SDK alignment — admin bracket (sole method on admin.tournaments)', () => {
  it('admin-tournaments.ts defines getBracket (sole admin bracket SDK method)', () => {
    const src = read(join(SDK_SRC, 'admin-tournaments.ts'));
    expect(src).toContain('getBracket');
    expect(src).toContain('/bracket');
  });

  it('admin-tournaments.ts getBracket uses GET method only', () => {
    const src = read(join(SDK_SRC, 'admin-tournaments.ts'));
    expect(src).toContain('getBracket');
    // Bracket is GET-only — no POST/PATCH/DELETE bracket methods.
    const bracketSection = src.slice(src.indexOf('getBracket'));
    expect(bracketSection.slice(0, 200)).not.toMatch(/method:\s*'(POST|PATCH|DELETE)'/);
  });

  it('AdminTournamentsClient interface includes getBracket', () => {
    const src = read(join(SDK_SRC, 'tournament-types.ts'));
    const adminTournamentsBlock = src.match(/AdminTournamentsClient\s*\{[^}]+\}/s)?.[0] ?? '';
    expect(adminTournamentsBlock).toContain('getBracket');
  });

  it('no competing admin-tournament-bracket.ts file exists', () => {
    expect(existsSync(join(SDK_SRC, 'admin-tournament-bracket.ts'))).toBe(false);
  });

  it('no separate AdminTournamentBracketClient type file exists', () => {
    expect(existsSync(join(SDK_SRC, 'admin-tournament-bracket-types.ts'))).toBe(false);
  });
});

// ─── PERMANENT: No public match detail route ──────────────────────────────────

describe('PERMANENT — no public match detail route', () => {
  it('public match controller has no :matchId detail route', () => {
    const src = read(join(MATCH_DIR, 'public-tournament-matches.controller.ts'));
    expect(src).not.toMatch(/:matchId/);
    expect(src).not.toMatch(/matches\/:matchId/);
    expect(src).not.toMatch(/@Get\(['"]:slug\/matches\/:matchId/);
  });

  it('public results controller has no :matchId or :resultId detail route', () => {
    const src = read(join(MATCH_DIR, 'public-tournament-results.controller.ts'));
    expect(src).not.toMatch(/:matchId|:resultId/);
  });
});

// ─── PERMANENT: No public result detail or mutation route ─────────────────────

describe('PERMANENT — no public result detail or mutation route', () => {
  it('public results controller has only GET endpoint (no mutations)', () => {
    const src = read(join(MATCH_DIR, 'public-tournament-results.controller.ts'));
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });

  it('public standings controller has no mutation endpoints', () => {
    const src = read(join(STANDINGS_DIR, 'public-tournament-standings.controller.ts'));
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });

  it('public bracket controller has no mutation endpoints', () => {
    const src = read(join(BRACKET_DIR, 'public-tournament-bracket.controller.ts'));
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });
});

// ─── PERMANENT: No live result feed / scoring / WebSocket ────────────────────

describe('PERMANENT — no live scoring or WebSocket scoreboard', () => {
  const sliceFiles = [
    join(MATCH_DIR, 'tournament-result.service.ts'),
    join(MATCH_DIR, 'public-tournament-results.controller.ts'),
    join(STANDINGS_DIR, 'tournament-standings.service.ts'),
    join(BRACKET_DIR, 'tournament-bracket.service.ts'),
  ];

  for (const file of sliceFiles) {
    it(`${file.split('/').pop()} has no WebSocket/live score references`, () => {
      const src = read(file);
      expect(src).not.toMatch(/WebSocket|Socket\.io|liveScore|scoreEvent|@WebSocketGateway/);
    });
  }
});

// ─── PERMANENT: No bracket collection/schema ──────────────────────────────────

describe('PERMANENT — no TournamentBracket collection or schema', () => {
  it('no tournament-brackets directory exists in API src', () => {
    expect(existsSync(join(API_SRC, 'tournament-brackets'))).toBe(false);
  });

  it('no bracket.schema.ts file in API src subdirs', () => {
    expect(existsSync(join(API_SRC, 'brackets', 'bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(BRACKET_DIR, 'tournament-bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(BRACKET_DIR, 'bracket.schema.ts'))).toBe(false);
  });

  it('bracket service does not inject a Mongoose bracket model', () => {
    const src = read(join(BRACKET_DIR, 'tournament-bracket.service.ts'));
    expect(src).not.toMatch(/@InjectModel\(['"]TournamentBracket/);
    expect(src).not.toMatch(/TournamentBracket\.name/);
  });

  it('no editable bracket method in bracket service', () => {
    const src = read(join(BRACKET_DIR, 'tournament-bracket.service.ts'));
    expect(src).not.toMatch(/editBracket|overrideBracket|saveBracket|createBracketNode/);
  });

  it('admin bracket controller has only GET (no bracket write endpoints)', () => {
    const src = read(join(ADMIN_BRACKET_DIR, 'admin-tournament-bracket.controller.ts'));
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });
});

// ─── PERMANENT: No permanent standings collection ─────────────────────────────

describe('PERMANENT — no permanent standings collection', () => {
  it('no tournament-standings.schema.ts file exists', () => {
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standings.schema.ts'))).toBe(false);
    expect(existsSync(join(STANDINGS_DIR, 'tournament-standing.schema.ts'))).toBe(false);
  });

  it('standings service does not inject a standings model', () => {
    const src = read(join(STANDINGS_DIR, 'tournament-standings.service.ts'));
    expect(src).not.toMatch(/@InjectModel\(['"]TournamentStanding/);
  });
});

// ─── PERMANENT: No Swiss / Double Elimination ────────────────────────────────

describe('PERMANENT — no Swiss or Double Elimination implementation', () => {
  const domainFiles = [
    join(MATCH_DIR, 'tournament-match.schema.ts'),
    join(STANDINGS_DIR, 'tournament-standings.service.ts'),
    join(BRACKET_DIR, 'tournament-bracket.service.ts'),
    join(MATCH_DIR, 'tournament-match-generation.ts'),
  ];

  for (const file of domainFiles) {
    it(`${file.split('/').pop()} has no Swiss/Double Elimination logic`, () => {
      const src = read(file);
      expect(src).not.toMatch(/swiss|Swiss/);
      expect(src).not.toMatch(/doubleElim|double_elim|DoubleElimination/i);
    });
  }

  it('tournament schema formats exclude swiss and double_elimination', () => {
    const src = read(join(API_SRC, 'tournaments/tournament.schema.ts'));
    expect(src).not.toContain("'swiss'");
    expect(src).not.toContain("'double_elimination'");
  });
});

// ─── PERMANENT: No fake operational data ─────────────────────────────────────

describe('PERMANENT — no fake or seed operational data', () => {
  const runtimeFiles = [
    join(MATCH_DIR, 'tournament-match.service.ts'),
    join(MATCH_DIR, 'tournament-result.service.ts'),
    join(STANDINGS_DIR, 'tournament-standings.service.ts'),
    join(BRACKET_DIR, 'tournament-bracket.service.ts'),
    join(MATCH_DIR, 'tournament-match-generation.ts'),
  ];

  for (const file of runtimeFiles) {
    it(`${file.split('/').pop()} has no fake/demo data`, () => {
      const src = read(file);
      expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
      expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
    });
  }

  it('no result-seed.ts or match-seed.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'result-seed.ts'))).toBe(false);
    expect(existsSync(join(MATCH_DIR, 'match-seed.ts'))).toBe(false);
    expect(existsSync(join(STANDINGS_DIR, 'standings-seed.ts'))).toBe(false);
    expect(existsSync(join(BRACKET_DIR, 'bracket-seed.ts'))).toBe(false);
  });
});

// ─── PERMANENT: No raw permission strings ─────────────────────────────────────

describe('PERMANENT — admin controllers use centralized Permissions.* constants', () => {
  const adminControllers = [
    join(ADMIN_MATCH_DIR, 'admin-tournament-matches.controller.ts'),
    join(ADMIN_RESULT_DIR, 'admin-tournament-results.controller.ts'),
    join(ADMIN_STANDINGS_DIR, 'admin-tournament-standings.controller.ts'),
    join(ADMIN_BRACKET_DIR, 'admin-tournament-bracket.controller.ts'),
  ];

  for (const file of adminControllers) {
    it(`${file.split('/').pop()} uses Permissions.* constants (no raw strings)`, () => {
      const src = read(file);
      expect(src).toContain('Permissions.');
      expect(src).not.toMatch(/'tournament\.(match|result|standing)\.(read|manage)'/);
      expect(src).not.toMatch(/"tournament\.(match|result|standing)\.(read|manage)"/);
    });
  }
});

// ─── PERMANENT: Audit action names are exact ─────────────────────────────────

describe('PERMANENT — audit action names are exact in Slice 7 services', () => {
  it('match service uses AuditAction.MATCH_CREATED, MATCH_UPDATED, MATCH_CANCELLED, MATCH_GENERATED', () => {
    const src = read(join(MATCH_DIR, 'tournament-match.service.ts'));
    expect(src).toMatch(/MATCH_CREATED|MATCH_UPDATED|MATCH_CANCELLED|MATCH_GENERATED/);
  });

  it('result service uses AuditAction.RESULT_RECORDED, RESULT_UPDATED, RESULT_VOIDED', () => {
    const src = read(join(MATCH_DIR, 'tournament-result.service.ts'));
    expect(src).toMatch(/RESULT_RECORDED|RESULT_UPDATED|RESULT_VOIDED/);
  });

  it('standings service uses AuditAction.STANDINGS_RECALCULATED', () => {
    const src = read(join(STANDINGS_DIR, 'tournament-standings.service.ts'));
    expect(src).toContain('STANDINGS_RECALCULATED');
  });

  it('audit calls are fire-and-forget (void) in all Slice 7 services', () => {
    const matchSrc = read(join(MATCH_DIR, 'tournament-match.service.ts'));
    const resultSrc = read(join(MATCH_DIR, 'tournament-result.service.ts'));
    const standingsSrc = read(join(STANDINGS_DIR, 'tournament-standings.service.ts'));
    expect(matchSrc).toContain('void this.auditService?.log');
    expect(resultSrc).toContain('void this.auditService?.log');
    expect(standingsSrc).toContain('void this.auditService?.log');
  });
});

// ─── PERMANENT: Analytics event names exact ───────────────────────────────────

describe('PERMANENT — analytics event names are exact', () => {
  // Allowed events: tournament.bracket_viewed, tournament.match_viewed.
  // These are frontend-triggered (Slice 9/10). Runtime code must not invent alternatives.

  const runtimeFiles = [
    join(MATCH_DIR, 'tournament-match.service.ts'),
    join(MATCH_DIR, 'tournament-result.service.ts'),
    join(STANDINGS_DIR, 'tournament-standings.service.ts'),
    join(BRACKET_DIR, 'tournament-bracket.service.ts'),
  ];

  it('no alternative bracket_viewed analytics event names exist in Slice 7 runtime', () => {
    for (const file of runtimeFiles) {
      const src = read(file);
      // Must not invent alternative names
      expect(src).not.toMatch(/bracketViewed|bracket_view(?!ed)|match_view(?!ed)|matchViewed/);
    }
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in Slice 7 runtime code', () => {
  const runtimeFiles = [
    join(MATCH_DIR, 'tournament-match.service.ts'),
    join(MATCH_DIR, 'tournament-result.service.ts'),
    join(MATCH_DIR, 'tournament-match-generation.ts'),
    join(MATCH_DIR, 'tournament-match.repository.ts'),
    join(STANDINGS_DIR, 'tournament-standings.service.ts'),
    join(BRACKET_DIR, 'tournament-bracket.service.ts'),
    join(ADMIN_MATCH_DIR, 'admin-tournament-matches.controller.ts'),
    join(ADMIN_RESULT_DIR, 'admin-tournament-results.controller.ts'),
    join(ADMIN_STANDINGS_DIR, 'admin-tournament-standings.controller.ts'),
    join(ADMIN_BRACKET_DIR, 'admin-tournament-bracket.controller.ts'),
  ];

  for (const file of runtimeFiles) {
    it(`${file.split('/').pop()} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(file);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }
});

// ─── TEMPORARY: No frontend public operational pages (Slice 9) ───────────────
// Remove these checks when Slice 9 (public operational frontend) lands.

describe('TEMPORARY (Slice 9) — no public frontend operational pages yet', () => {
  it('TEMPORARY — no /tournaments/:slug/matches page yet', () => {
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/matches.vue'))).toBe(false);
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/matches/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/:slug/results page yet', () => {
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/results.vue'))).toBe(false);
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/results/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/:slug/standings page yet', () => {
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/standings.vue'))).toBe(false);
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/standings/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/:slug/bracket page yet', () => {
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/bracket.vue'))).toBe(false);
    expect(existsSync(join(WEB_PAGES, 'tournaments/[slug]/bracket/index.vue'))).toBe(false);
  });
});

// ─── TEMPORARY: No frontend admin operational pages (Slice 10) ───────────────
// Remove these checks when Slice 10 (admin operational frontend) lands.

describe('TEMPORARY (Slice 10) — no admin frontend operational pages yet', () => {
  it('TEMPORARY — no /admin/tournaments/:id/matches page yet', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/matches.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/matches/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /admin/tournaments/:id/results page yet', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/results.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/results/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /admin/tournaments/:id/standings page yet', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/standings.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/standings/index.vue'))).toBe(false);
  });

  it('TEMPORARY — no /admin/tournaments/:id/bracket page yet', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/bracket.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/bracket/index.vue'))).toBe(false);
  });
});

// ─── PERMANENT: No standalone admin operations/preview routes ─────────────────

describe('PERMANENT — no standalone admin operations or preview routes', () => {
  it('no /admin/tournaments/:id/operations page exists', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/operations.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/operations/index.vue'))).toBe(false);
  });

  it('no /admin/tournaments/:id/preview page exists', () => {
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/preview.vue'))).toBe(false);
    expect(existsSync(join(ADMIN_PAGES, 'tournaments/[id]/preview/index.vue'))).toBe(false);
  });
});
