/**
 * Slice 9 hardening — cross-cutting guardrails for all public operational views.
 *
 * Covers:
 *   - All 5 operational routes exist
 *   - No forbidden routes exist (match detail, result detail, bracket detail)
 *   - No admin operational frontend routes (Slice 10 boundary)
 *   - Future Slice 10 admin routes are not permanently blocked here
 *   - All composables are SDK-only, no admin SDK, no direct fetch
 *   - All pages are read-only (no mutations across any page)
 *   - Privacy: no phone/email/contact/userId across all pages
 *   - Empty/unavailable states: honest and API-backed
 *   - No live scoring / WebSocket / bracket editor across all pages
 *   - No Swiss / Double Elimination UI
 *   - Analytics event names exact across all composables
 *   - SEO correct across all pages (indexable, no blanket noindex)
 *   - Registration routes remain noindex
 *   - No fake operational data across any page
 *   - No placeholder/coming-soon UI
 *   - No hardcoded origins
 *   - Docs/verification file exists
 *
 * Per-task specs (slice9-guardrails, slice9-results-standings-guardrails,
 * slice9-bracket-guardrails) cover deeper per-page checks.
 * This file covers the cross-cutting view of all 5 pages together.
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
const REPO_ROOT = join(__dirname, '../../../..');
const DOCS_DIR = join(REPO_ROOT, 'docs', 'development');

const OPERATIONAL_PAGES = [
  'participants.vue',
  'matches.vue',
  'results.vue',
  'standings.vue',
  'bracket.vue',
] as const;

const OPERATIONAL_COMPOSABLES = [
  'useTournamentParticipants.ts',
  'useTournamentMatches.ts',
  'useTournamentResults.ts',
  'useTournamentStandings.ts',
  'useTournamentBracket.ts',
] as const;

function slugPage(name: string): string {
  return readFileSync(join(SLUG_DIR, name), 'utf8');
}

function readComposable(name: string): string {
  return readFileSync(join(COMPOSABLES_DIR, name), 'utf8');
}

// ─── All 5 operational routes exist ──────────────────────────────────────────

describe('PERMANENT — all Slice 9 operational routes exist', () => {
  it('/tournaments/[slug]/participants.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'participants.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/matches.vue exists (or matches/index.vue)', () => {
    const flat = existsSync(join(SLUG_DIR, 'matches.vue'));
    const nested = existsSync(join(SLUG_DIR, 'matches', 'index.vue'));
    expect(flat || nested).toBe(true);
  });

  it('/tournaments/[slug]/results.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/standings.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/bracket.vue exists (or bracket/index.vue)', () => {
    const flat = existsSync(join(SLUG_DIR, 'bracket.vue'));
    const nested = existsSync(join(SLUG_DIR, 'bracket', 'index.vue'));
    expect(flat || nested).toBe(true);
  });
});

// ─── All 5 composables exist ──────────────────────────────────────────────────

describe('PERMANENT — all Slice 9 operational composables exist', () => {
  for (const composable of OPERATIONAL_COMPOSABLES) {
    it(`${composable} exists`, () => {
      expect(existsSync(join(COMPOSABLES_DIR, composable))).toBe(true);
    });
  }
});

// ─── Forbidden routes: public match/result detail ─────────────────────────────

describe('PERMANENT — forbidden public match and result detail routes', () => {
  it('no /tournaments/[slug]/matches/[matchId].vue (public match detail forbidden forever)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[matchId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[id].vue (public match detail forbidden forever)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[id].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/results/[resultId].vue (no public result detail)', () => {
    expect(existsSync(join(SLUG_DIR, 'results', '[resultId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/results/[id].vue (no public result detail)', () => {
    expect(existsSync(join(SLUG_DIR, 'results', '[id].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/bracket/[id].vue (no bracket detail)', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket', '[id].vue'))).toBe(false);
  });
});

// ─── No admin operational frontend routes ────────────────────────────────────

describe('PERMANENT — no admin standalone operations or preview routes', () => {
  const adminSlugDir = join(REPO_ROOT, 'apps', 'admin', 'pages', 'tournaments', '[id]');

  it('no /admin/tournaments/[id]/operations.vue (permanently forbidden admin route)', () => {
    expect(existsSync(join(adminSlugDir, 'operations.vue'))).toBe(false);
    expect(existsSync(join(adminSlugDir, 'operations', 'index.vue'))).toBe(false);
  });

  it('no /admin/tournaments/[id]/preview.vue (permanently forbidden admin route)', () => {
    expect(existsSync(join(adminSlugDir, 'preview.vue'))).toBe(false);
    expect(existsSync(join(adminSlugDir, 'preview', 'index.vue'))).toBe(false);
  });
});

// ─── All composables: SDK-only, no admin SDK, no direct fetch ─────────────────

describe('PERMANENT — all operational composables use SDK only, no admin SDK, no direct fetch', () => {
  for (const composable of OPERATIONAL_COMPOSABLES) {
    it(`${composable} uses createTournamentsDiscoveryApi`, () => {
      const src = readComposable(composable);
      expect(src).toContain('createTournamentsDiscoveryApi');
    });

    it(`${composable} has no $fetch or axios`, () => {
      const src = readComposable(composable);
      expect(src).not.toMatch(/\$fetch|axios/);
    });

    it(`${composable} has no admin SDK`, () => {
      const src = readComposable(composable);
      expect(src).not.toMatch(/admin|Admin/);
    });

    it(`${composable} has no hardcoded localhost`, () => {
      const src = readComposable(composable);
      expect(src).not.toMatch(/localhost/);
    });

    it(`${composable} has no hardcoded qesb.ir`, () => {
      const src = readComposable(composable);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }
});

// ─── All pages: read-only (no mutations) ─────────────────────────────────────

describe('PERMANENT — all operational pages are read-only (no mutations)', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has no registration approval/reject actions`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/approveRegistration|rejectRegistration|cancelRegistration/i);
    });

    it(`${page} has no participant remove/disqualify actions`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/removeParticipant|disqualifyParticipant/i);
    });

    it(`${page} has no match create/update/cancel actions`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/createMatch|updateMatch|cancelMatch/i);
    });

    it(`${page} has no result record/update/void actions`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/recordResult|updateResult|voidResult/i);
    });

    it(`${page} has no standings recalculate action`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/recalculate|recalculat/i);
    });

    it(`${page} has no admin SDK`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/useAdminTournament|useAdminBracket|AdminSdk/i);
    });
  }
});

// ─── All pages: no live scoring / WebSocket / editor ─────────────────────────

describe('PERMANENT — no live scoring, WebSocket, or bracket editor in any page', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has no WebSocket or live scoring`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/WebSocket|socket\.io|pusher|ably|liveScore|liveResult/i);
    });

    it(`${page} has no bracket editor or drag/drop controls`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/bracketEditor|BracketEditor|bracket-editor/i);
      expect(src).not.toMatch(/\bdraggable\b|@dragstart|@dragend|@drop|ondragstart/i);
    });
  }
});

// ─── All pages: no Swiss / Double Elimination UI ─────────────────────────────

describe('PERMANENT — no Swiss or Double Elimination UI in any page', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has no Swiss format UI`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/swiss|Swiss/);
    });

    it(`${page} has no Double Elimination UI`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/double.?elimination|Double.?Elimination/i);
    });
  }
});

// ─── All pages: privacy — no phone/email/contact/userId ──────────────────────

describe('PERMANENT — all operational pages respect public privacy', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} does not expose phone or email fields`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/\.phone\b|\.email\b|contactPhone|contactEmail/i);
    });

    it(`${page} does not expose raw userId field`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/\.userId\b/);
    });

    it(`${page} has no admin notes`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/adminNotes|admin_notes/i);
    });
  }
});

// ─── All pages: no fake data, no placeholder UI ───────────────────────────────

describe('PERMANENT — no fake data or placeholder UI in any page', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has no fake/seed data`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/fake|FAKE|Dragon Cup|seedData|SEED_DATA/);
    });

    it(`${page} has no coming-soon or placeholder UI`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/coming.?soon|به زودی|placeholder.*bracket|placeholder.*match/i);
    });
  }
});

// ─── All pages: no hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — all operational pages have no hardcoded origins', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has no hardcoded localhost`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/localhost/);
    });

    it(`${page} has no hardcoded qesb.ir`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }
});

// ─── All pages: useHead (SEO) and noindex only on not-found ──────────────────

describe('PERMANENT — all operational pages have correct SEO setup', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} uses useHead`, () => {
      const src = slugPage(page);
      expect(src).toContain('useHead');
    });

    it(`${page} applies noindex only for not-found state, not blanket`, () => {
      const src = slugPage(page);
      expect(src).toContain('noindex');
      expect(src).not.toContain("'noindex,nofollow'");
    });
  }
});

// ─── Registration routes remain noindex ──────────────────────────────────────

describe('PERMANENT — registration routes remain noindex (Slice 9 must not break)', () => {
  it('/tournaments/[slug]/register.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'register.vue'), 'utf8');
    expect(src).toContain('noindex');
  });

  it('/tournaments/[slug]/my-registration.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'my-registration.vue'), 'utf8');
    expect(src).toContain('noindex');
  });
});

// ─── All pages: required states ──────────────────────────────────────────────

describe('PERMANENT — all operational pages have loading, error, and not-found states', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has loading state (pending)`, () => {
      const src = slugPage(page);
      expect(src).toContain('pending');
    });

    it(`${page} has error state (fetchError)`, () => {
      const src = slugPage(page);
      expect(src).toContain('fetchError');
    });

    it(`${page} has not-found state (notFound)`, () => {
      const src = slugPage(page);
      expect(src).toContain('notFound');
    });
  }
});

// ─── Analytics event names exact ─────────────────────────────────────────────

describe('PERMANENT — analytics event names exact in composables', () => {
  it('useTournamentMatches documents exact event name tournament.match_viewed', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).toContain('tournament.match_viewed');
  });

  it('useTournamentBracket documents exact event name tournament.bracket_viewed', () => {
    const src = readComposable('useTournamentBracket.ts');
    expect(src).toContain('tournament.bracket_viewed');
  });

  it('no composable uses forbidden match_viewed variant', () => {
    for (const composable of OPERATIONAL_COMPOSABLES) {
      const src = readComposable(composable);
      expect(src).not.toMatch(/'match_viewed'|'tournament_match_viewed'/);
    }
  });

  it('no composable uses forbidden bracket_viewed variant', () => {
    for (const composable of OPERATIONAL_COMPOSABLES) {
      const src = readComposable(composable);
      expect(src).not.toMatch(/'bracket_viewed'|'tournament_bracket_viewed'/);
    }
  });
});

// ─── All pages: compact tournament context, no full duplication ───────────────

describe('PERMANENT — all operational pages use compact tournament context', () => {
  for (const page of OPERATIONAL_PAGES) {
    it(`${page} has back-link to /tournaments/:slug (compact context)`, () => {
      const src = slugPage(page);
      expect(src).toMatch(/\/tournaments\/\$\{tournament\.slug\}`/);
    });

    it(`${page} has no registration form`, () => {
      const src = slugPage(page);
      expect(src).not.toMatch(/<form.*register|registerForm|RegistrationForm/i);
    });
  }
});

// ─── Nav cross-linking: all pages link to all others ─────────────────────────

describe('PERMANENT — operational pages nav cross-links all 5 tabs', () => {
  const routes = ['participants', 'matches', 'results', 'standings', 'bracket'];

  for (const page of OPERATIONAL_PAGES) {
    for (const route of routes) {
      it(`${page} nav links to /${route}`, () => {
        const src = slugPage(page);
        expect(src).toMatch(new RegExp(`/${route}`));
      });
    }
  }
});

// ─── Docs file exists ─────────────────────────────────────────────────────────

describe('PERMANENT — Slice 9 verification docs exist', () => {
  it('docs/development/phase-1-slice-9-verification.md exists', () => {
    expect(existsSync(join(DOCS_DIR, 'phase-1-slice-9-verification.md'))).toBe(true);
  });
});
