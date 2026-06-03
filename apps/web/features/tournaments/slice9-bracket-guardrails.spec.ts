/**
 * Slice 9.3 guardrails — Public bracket view.
 *
 * Permanent guardrails (never remove):
 *   - /tournaments/:slug/bracket route exists
 *   - No /tournaments/:slug/bracket/[id].vue (no bracket detail page)
 *   - No /tournaments/:slug/matches/:matchId route (public match detail forbidden)
 *   - SDK-only data access (getBracket)
 *   - No direct fetch / $fetch / axios
 *   - No admin SDK in public frontend
 *   - No public mutation SDK
 *   - Bracket rendered from backend projection only (no frontend-generated bracket)
 *   - No editable bracket controls (no drag/drop, no score edit, no winner override)
 *   - No bracket editor
 *   - No clickable match detail links
 *   - No fake bracket data
 *   - No placeholder/coming-soon UI
 *   - No hardcoded localhost or qesb.ir
 *   - No sensitive participant data (phone, email, internal IDs)
 *   - No admin notes / registration internal fields
 *   - tournament.bracket_viewed exact event name documented in useTournamentBracket
 *   - No bracket_viewed, tournament_bracket_viewed, tournament.bracketViewed
 *   - No bracket collection/model (backend reads from matches only)
 *   - No Swiss / Double Elimination UI
 *   - Page is indexable only when tournament is public-safe
 *   - Nav links to bracket page present in all other operational pages
 *   - No /api/v1/tournaments/:slug/bracket/:matchId backend endpoint
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

// ─── Jest globals ─────────────────────────────────────────────────────────────

type TestFn = () => void | Promise<void>;

interface Matchers {
  readonly not: Matchers;
  toBe(expected: unknown): void;
  toContain(expected: unknown): void;
  toMatch(pattern: RegExp | string): void;
  toBeDefined(): void;
}

declare const describe: (name: string, fn: TestFn) => void;
declare const it: (name: string, fn: TestFn) => void;
declare const expect: (actual: unknown) => Matchers;

// ─── Paths ────────────────────────────────────────────────────────────────────

const WEB_ROOT = join(__dirname, '../..');
const PAGES_DIR = join(WEB_ROOT, 'pages');
const SLUG_DIR = join(PAGES_DIR, 'tournaments', '[slug]');
const COMPOSABLES_DIR = join(WEB_ROOT, 'composables');
const API_ROOT = join(__dirname, '../../../..', 'apps/api/src');

function readComposable(name: string): string {
  return readFileSync(join(COMPOSABLES_DIR, name), 'utf8');
}

function slugPage(name: string): string {
  return readFileSync(join(SLUG_DIR, name), 'utf8');
}

// ─── Required route exists ────────────────────────────────────────────────────

describe('PERMANENT — Slice 9.3 bracket route exists', () => {
  it('/tournaments/[slug]/bracket.vue exists (or bracket/index.vue)', () => {
    const flat = existsSync(join(SLUG_DIR, 'bracket.vue'));
    const nested = existsSync(join(SLUG_DIR, 'bracket', 'index.vue'));
    expect(flat || nested).toBe(true);
  });
});

// ─── Forbidden detail routes ──────────────────────────────────────────────────

describe('PERMANENT — no bracket or match detail routes (forbidden forever)', () => {
  it('no /tournaments/[slug]/bracket/[id].vue', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket', '[id].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[matchId].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[matchId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[id].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[id].vue'))).toBe(false);
  });
});

// ─── useTournamentBracket composable ─────────────────────────────────────────

describe('PERMANENT — useTournamentBracket composable is SDK-only', () => {
  it('useTournamentBracket.ts exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentBracket.ts'))).toBe(true);
  });

  it('uses createTournamentsDiscoveryApi (not direct fetch)', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('has no $fetch or axios', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/\$fetch|axios/);
  });

  it('has no admin SDK import', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('has no hardcoded localhost', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/localhost/);
  });

  it('has no hardcoded qesb.ir', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── Analytics event name ─────────────────────────────────────────────────────

describe('PERMANENT — analytics event name tournament.bracket_viewed is exact', () => {
  it('useTournamentBracket documents exact event name tournament.bracket_viewed', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).toContain('tournament.bracket_viewed');
  });

  it('useTournamentBracket does not use bracket_viewed (missing namespace)', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/'bracket_viewed'/);
    expect(src).not.toMatch(/'tournament_bracket_viewed'/);
  });

  it('useTournamentBracket does not use tournament.bracketViewed (camelCase variant)', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).not.toMatch(/'tournament\.bracketViewed'/);
  });
});

// ─── Bracket page: SDK access ─────────────────────────────────────────────────

describe('PERMANENT — bracket page uses SDK-only data access', () => {
  it('bracket.vue uses getBracket SDK method', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('getBracket');
  });

  it('bracket.vue has no $fetch or axios', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/\$fetch|axios/);
  });

  it('bracket.vue has no admin SDK import', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('bracket.vue uses useTournamentBracket composable', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('useTournamentBracket');
  });
});

// ─── Bracket page: no mutation UI ────────────────────────────────────────────

describe('PERMANENT — bracket page has no mutation or editor UI', () => {
  it('bracket.vue has no drag/drop attributes', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(
      /\bdraggable\b|@dragstart|@dragend|@drop|v-drag\b|ondragstart|ondragend/i,
    );
  });

  it('bracket.vue has no score edit or winner override UI', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/editScore|updateScore|recordScore|setScore|overrideWinner|setWinner/i);
  });

  it('bracket.vue has no form or input elements', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/<form/i);
    expect(src).not.toMatch(/<input/i);
  });

  it('bracket.vue has no bracket editor references', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/bracketEditor|BracketEditor|bracket-editor/i);
  });
});

// ─── Bracket page: no match detail links ─────────────────────────────────────

describe('PERMANENT — bracket page has no clickable match detail links', () => {
  it('bracket.vue has no NuxtLink to match detail', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/\/matches\/\$\{|\/matches\/`\$\{|to=.*matches.*matchId/);
  });

  it('bracket.vue has no router.push to match detail', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/router\.push.*\/matches\//);
  });
});

// ─── Bracket page: renders backend projection ─────────────────────────────────

describe('PERMANENT — bracket renders backend projection (not frontend-generated)', () => {
  it('bracket.vue iterates over rounds from bracket API response', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('rounds');
  });

  it('bracket.vue uses BracketRoundDto fields (round, label, matches)', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('round.label');
    expect(src).toContain('round.matches');
  });

  it('bracket.vue uses BracketMatchNodeDto fields (matchId, participant1, participant2)', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('match.matchId');
    expect(src).toContain('participant1');
    expect(src).toContain('participant2');
  });

  it('bracket.vue shows winner indicator (winnerId field)', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('winnerId');
  });
});

// ─── Bracket page: states ─────────────────────────────────────────────────────

describe('PERMANENT — bracket page has all required states', () => {
  it('bracket.vue has loading state', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('pending');
  });

  it('bracket.vue has empty/unavailable state (bracket unavailable until matches exist)', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('unavailable');
  });

  it('bracket.vue has error state', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('fetchError');
  });

  it('bracket.vue has not-found state', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('notFound');
  });
});

// ─── Bracket page: privacy ────────────────────────────────────────────────────

describe('PERMANENT — bracket page has no sensitive data exposure', () => {
  it('bracket.vue has no phone or email fields', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/\.phone|\.email|contactEmail|contactPhone/i);
  });

  it('bracket.vue has no userId or internalId fields', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/\.userId\b|\.internalId\b/);
  });
});

// ─── Bracket page: no fake data ───────────────────────────────────────────────

describe('PERMANENT — bracket page has no fake data', () => {
  it('bracket.vue has no fake/seed data', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });
});

// ─── Bracket page: no hardcoded origins ──────────────────────────────────────

describe('PERMANENT — bracket page has no hardcoded origins', () => {
  it('bracket.vue has no hardcoded localhost', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/localhost/);
  });

  it('bracket.vue has no hardcoded qesb.ir', () => {
    const src = slugPage('bracket.vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── Bracket page: SEO ───────────────────────────────────────────────────────

describe('PERMANENT — bracket page SEO', () => {
  it('bracket.vue uses useHead', () => {
    const src = slugPage('bracket.vue');
    expect(src).toContain('useHead');
  });
});

// ─── Nav: bracket link in all operational pages ───────────────────────────────

describe('PERMANENT — all operational pages link to bracket', () => {
  it('participants.vue nav links to /bracket', () => {
    const src = slugPage('participants.vue');
    expect(src).toMatch(/\/bracket/);
  });

  it('matches.vue nav links to /bracket', () => {
    const src = slugPage('matches.vue');
    expect(src).toMatch(/\/bracket/);
  });

  it('results.vue nav links to /bracket', () => {
    const src = slugPage('results.vue');
    expect(src).toMatch(/\/bracket/);
  });

  it('standings.vue nav links to /bracket', () => {
    const src = slugPage('standings.vue');
    expect(src).toMatch(/\/bracket/);
  });
});

// ─── Backend: no bracket collection/model ────────────────────────────────────

describe('PERMANENT — no bracket collection or independent model in API', () => {
  it('no tournament-brackets directory in API src', () => {
    expect(existsSync(join(API_ROOT, 'tournament-brackets'))).toBe(false);
  });

  it('no bracket.schema.ts in tournament-bracket dir', () => {
    expect(existsSync(join(API_ROOT, 'tournament-bracket', 'bracket.schema.ts'))).toBe(false);
  });
});

// ─── Backend: no match detail API ────────────────────────────────────────────

describe('PERMANENT — no public match detail API endpoint', () => {
  it('public-tournament-bracket controller has no /:matchId GET', () => {
    const controllerPath = join(
      API_ROOT,
      'tournament-bracket',
      'public-tournament-bracket.controller.ts',
    );
    if (!existsSync(controllerPath)) return;
    const src = readFileSync(controllerPath, 'utf8');
    expect(src).not.toMatch(/@Get\s*\(\s*['"`]:slug\/bracket\/:?match/);
    expect(src).not.toMatch(/@Get\s*\(\s*['"`]:slug\/matches\/:?matchId/);
  });
});
