/**
 * Slice 9.2 guardrails — Public results and standings views.
 *
 * Permanent guardrails (never remove):
 *   - /tournaments/:slug/results route exists
 *   - /tournaments/:slug/standings route exists
 *   - No /tournaments/:slug/results/:resultId route (no public result detail)
 *   - No /tournaments/:slug/matches/:matchId route (public match detail forbidden)
 *   - SDK-only data access (getResults, getStandings)
 *   - No direct fetch/$fetch/axios in Slice 9.2 composables
 *   - No admin SDK in Slice 9.2 composables
 *   - No result mutation UI (no score edit, no winner override)
 *   - No standings recalculation UI
 *   - Honest empty/unavailable state for manual format standings
 *   - No fake results or fake standings
 *   - No placeholder/coming-soon UI
 *   - No hardcoded localhost or qesb.ir
 *   - Results page resolves participant names (no raw IDs exposed)
 *   - No /api/v1/tournaments/:slug/results/:resultId backend endpoint
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

// ─── Required routes exist ────────────────────────────────────────────────────

describe('PERMANENT — Slice 9.2 required public routes exist', () => {
  it('/tournaments/[slug]/results.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/standings.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(true);
  });
});

// ─── Forbidden detail routes ──────────────────────────────────────────────────

describe('PERMANENT — no public result detail routes (forbidden forever)', () => {
  it('no /tournaments/[slug]/results/[resultId].vue', () => {
    expect(existsSync(join(SLUG_DIR, 'results', '[resultId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/results/[id].vue', () => {
    expect(existsSync(join(SLUG_DIR, 'results', '[id].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[matchId].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[matchId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[id].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[id].vue'))).toBe(false);
  });
});

// ─── SDK-only composables ─────────────────────────────────────────────────────

describe('PERMANENT — useTournamentResults composable is SDK-only', () => {
  it('useTournamentResults.ts exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentResults.ts'))).toBe(true);
  });

  it('uses createTournamentsDiscoveryApi (not direct fetch)', () => {
    const src = readComposable('useTournamentResults.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('has no $fetch or axios', () => {
    const src = readComposable('useTournamentResults.ts');
    expect(src).not.toMatch(/\$fetch|axios/);
  });

  it('has no admin SDK import', () => {
    const src = readComposable('useTournamentResults.ts');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('has no hardcoded localhost', () => {
    const src = readComposable('useTournamentResults.ts');
    expect(src).not.toMatch(/localhost/);
  });

  it('has no hardcoded qesb.ir', () => {
    const src = readComposable('useTournamentResults.ts');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

describe('PERMANENT — useTournamentStandings composable is SDK-only', () => {
  it('useTournamentStandings.ts exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentStandings.ts'))).toBe(true);
  });

  it('uses createTournamentsDiscoveryApi (not direct fetch)', () => {
    const src = readComposable('useTournamentStandings.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('has no $fetch or axios', () => {
    const src = readComposable('useTournamentStandings.ts');
    expect(src).not.toMatch(/\$fetch|axios/);
  });

  it('has no admin SDK import', () => {
    const src = readComposable('useTournamentStandings.ts');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('has no hardcoded localhost', () => {
    const src = readComposable('useTournamentStandings.ts');
    expect(src).not.toMatch(/localhost/);
  });

  it('has no hardcoded qesb.ir', () => {
    const src = readComposable('useTournamentStandings.ts');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── Results page safety ──────────────────────────────────────────────────────

describe('PERMANENT — results page has no mutation UI', () => {
  it('results.vue has no score edit button or form', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/editScore|updateScore|recordScore|setScore/i);
    expect(src).not.toMatch(/<form/i);
    expect(src).not.toMatch(/<input/i);
  });

  it('results.vue has no winner override button', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/overrideWinner|setWinner|changeWinner/i);
  });

  it('results.vue has no admin SDK import', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('results.vue resolves participant names (does not expose raw IDs alone)', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('resolveParticipantName');
  });
});

describe('PERMANENT — results page has correct states', () => {
  it('results.vue has loading state', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('pending');
  });

  it('results.vue has empty state', () => {
    const src = slugPage('results.vue');
    expect(src.toLowerCase()).toContain('نتیجه');
  });

  it('results.vue has error state', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('fetchError');
  });

  it('results.vue has not-found state', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('notFound');
  });
});

describe('PERMANENT — results page has no fake data', () => {
  it('results.vue has no fake/seed data', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('results.vue uses SDK getResults (not hardcoded data)', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('getResults');
  });
});

describe('PERMANENT — results page has no hardcoded origins', () => {
  it('results.vue has no hardcoded localhost', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/localhost/);
  });

  it('results.vue has no hardcoded qesb.ir', () => {
    const src = slugPage('results.vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

describe('PERMANENT — results page SEO', () => {
  it('results.vue uses useHead', () => {
    const src = slugPage('results.vue');
    expect(src).toContain('useHead');
  });
});

// ─── Standings page safety ────────────────────────────────────────────────────

describe('PERMANENT — standings page has no recalculation UI', () => {
  it('standings.vue has no recalculate button or trigger', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/recalculate|recalculat/i);
  });

  it('standings.vue has no admin SDK import', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/admin|Admin/);
  });

  it('standings.vue has no mutation composable', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/useTournamentAdmin|useAdminTournament/);
  });
});

describe('PERMANENT — standings page has correct states', () => {
  it('standings.vue has loading state', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain('pending');
  });

  it('standings.vue has empty state', () => {
    const src = slugPage('standings.vue');
    expect(src.toLowerCase()).toContain('رده‌بندی');
  });

  it('standings.vue has error state', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain('fetchError');
  });

  it('standings.vue has not-found state', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain('notFound');
  });

  it('standings.vue has unavailable state for manual format', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain("'manual'");
    expect(src).toContain('unavailable');
  });
});

describe('PERMANENT — standings page has no fake data', () => {
  it('standings.vue has no fake/seed data', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('standings.vue uses SDK getStandings (not hardcoded data)', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain('getStandings');
  });
});

describe('PERMANENT — standings page has no hardcoded origins', () => {
  it('standings.vue has no hardcoded localhost', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/localhost/);
  });

  it('standings.vue has no hardcoded qesb.ir', () => {
    const src = slugPage('standings.vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

describe('PERMANENT — standings page SEO', () => {
  it('standings.vue uses useHead', () => {
    const src = slugPage('standings.vue');
    expect(src).toContain('useHead');
  });
});

// ─── Nav includes results and standings ───────────────────────────────────────

describe('PERMANENT — nav in operational pages includes results and standings links', () => {
  it('participants.vue nav links to /results', () => {
    const src = slugPage('participants.vue');
    expect(src).toMatch(/\/results/);
  });

  it('participants.vue nav links to /standings', () => {
    const src = slugPage('participants.vue');
    expect(src).toMatch(/\/standings/);
  });

  it('matches.vue nav links to /results', () => {
    const src = slugPage('matches.vue');
    expect(src).toMatch(/\/results/);
  });

  it('matches.vue nav links to /standings', () => {
    const src = slugPage('matches.vue');
    expect(src).toMatch(/\/standings/);
  });
});

// ─── Backend: no public result detail API ─────────────────────────────────────

describe('PERMANENT — no public result detail API endpoint', () => {
  it('public-tournament-results controller has no /:resultId or /:id GET', () => {
    const controllerPath = join(
      API_ROOT,
      'tournament-matches',
      'public-tournament-results.controller.ts',
    );
    if (!existsSync(controllerPath)) return;
    const src = readFileSync(controllerPath, 'utf8');
    expect(src).not.toMatch(/@Get\s*\(\s*['"`]:slug\/results\/:?result/);
    expect(src).not.toMatch(/@Get\s*\(\s*['"`]:slug\/results\/:?id/);
  });
});
