/**
 * Task 8.4 hardening — Slice 8 route, SEO, analytics, format, and scope guardrails.
 *
 * Permanent guardrails (never remove):
 *   - /tournaments and /tournaments/:slug are the only new Slice 8 public routes
 *   - /tournaments/:slug/matches/:matchId is permanently forbidden
 *   - /admin/v1/tournaments/:id/operations is permanently forbidden
 *   - /admin/v1/tournaments/:id/preview is permanently forbidden
 *   - /tournaments is indexable (no noindex)
 *   - /tournaments/:slug is indexable for public-safe tournaments
 *   - Registration pages remain noindex
 *   - Unrelated public content/news pages are not noindexed by Slice 8
 *   - usePublicTournaments routes to search.tournaments() for text search
 *   - usePublicTournaments routes to tournaments.list() for structured filtering
 *   - No swiss/double_elimination/advanced_bracket_editor format in UI or filter
 *   - No placeholder/coming-soon UI in Slice 8 pages
 *   - No public operational SDK methods in usePublicTournaments or useTournamentDetail
 *   - analytics event name 'tournament.viewed' in useTournamentDetail (exact)
 *   - No hardcoded localhost or qesb.ir in Slice 8 composables
 *
 * Temporary Slice-8 precondition checks (labeled TEMPORARY — remove when feature slice lands):
 *   - No /tournaments/[slug]/participants.vue  → remove when Slice 9 lands
 *   - No /tournaments/[slug]/matches.vue       → remove when Slice 9 lands
 *   - No /tournaments/[slug]/results.vue       → remove when Slice 9 lands
 *   - No /tournaments/[slug]/standings.vue     → remove when Slice 9 lands
 *   - No /tournaments/[slug]/bracket.vue       → remove when Slice 9 lands
 *
 * Related:
 *   - slice8-guardrails.spec.ts (discovery page SDK/SEO/fake-data)
 *   - tournament-detail-guardrails.spec.ts (detail page)
 *   - registration-guardrails.spec.ts (registration pages)
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

// ─── Paths ─────────────────────────────────────────────────────────────────

const WEB_ROOT = join(__dirname, '../..');
const PAGES_DIR = join(WEB_ROOT, 'pages');
const SLUG_DIR = join(PAGES_DIR, 'tournaments', '[slug]');
const COMPOSABLES_DIR = join(WEB_ROOT, 'composables');
const API_ROOT = join(__dirname, '../../../..', 'apps/api/src');

function readPage(rel: string): string {
  return readFileSync(join(PAGES_DIR, rel), 'utf8');
}

function readComposable(name: string): string {
  return readFileSync(join(COMPOSABLES_DIR, name), 'utf8');
}

function readCard(): string {
  return readFileSync(join(WEB_ROOT, 'components', 'tournaments', 'TournamentCard.vue'), 'utf8');
}

// ─── Slice 8 route inventory ──────────────────────────────────────────────────

describe('PERMANENT — Slice 8 required public routes exist', () => {
  it('/tournaments/index.vue exists', () => {
    expect(existsSync(join(PAGES_DIR, 'tournaments', 'index.vue'))).toBe(true);
  });

  it('/tournaments/[slug].vue exists', () => {
    expect(existsSync(join(PAGES_DIR, 'tournaments', '[slug].vue'))).toBe(true);
  });

  it('/tournaments/[slug]/register.vue still exists (Slice 6)', () => {
    expect(existsSync(join(SLUG_DIR, 'register.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/my-registration.vue still exists (Slice 6)', () => {
    expect(existsSync(join(SLUG_DIR, 'my-registration.vue'))).toBe(true);
  });
});

// ─── TEMPORARY: Slice 9 routes not yet created ───────────────────────────────
//
// These checks verify that operational public pages have not been accidentally
// created before the appropriate slice. Remove each when the corresponding
// slice adds the route.

describe('TEMPORARY — Slice 9 routes not yet created (remove when Slice 9 lands)', () => {
  it('TEMPORARY — no /tournaments/[slug]/participants.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'participants.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/[slug]/matches.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'matches.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/[slug]/results.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/[slug]/standings.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(false);
  });

  it('TEMPORARY — no /tournaments/[slug]/bracket.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket.vue'))).toBe(false);
  });
});

// ─── PERMANENT forbidden routes ───────────────────────────────────────────────

describe('PERMANENT — forbidden routes (never remove)', () => {
  it('PERMANENT — no /tournaments/[slug]/matches directory (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches'))).toBe(false);
  });

  it('PERMANENT — admin tournaments controller has no /operations route', () => {
    const controllerPath = join(
      API_ROOT,
      'admin',
      'tournaments',
      'admin-tournaments.controller.ts',
    );
    if (!existsSync(controllerPath)) return;
    const src = readFileSync(controllerPath, 'utf8');
    expect(src).not.toContain('/operations');
    expect(src).not.toMatch(/['"`]operations['"`]/);
  });

  it('PERMANENT — admin tournaments controller has no /preview route', () => {
    const controllerPath = join(
      API_ROOT,
      'admin',
      'tournaments',
      'admin-tournaments.controller.ts',
    );
    if (!existsSync(controllerPath)) return;
    const src = readFileSync(controllerPath, 'utf8');
    expect(src).not.toContain('/preview');
    expect(src).not.toMatch(/['"`]preview['"`]/);
  });

  it('PERMANENT — public tournaments controller has no /matches/:matchId route', () => {
    const controllerPath = join(API_ROOT, 'public-tournaments', 'public-tournaments.controller.ts');
    if (!existsSync(controllerPath)) return;
    const src = readFileSync(controllerPath, 'utf8');
    expect(src).not.toMatch(/matches\/:matchId/);
    expect(src).not.toMatch(/matchId/);
  });
});

// ─── SEO / index / noindex guardrails ────────────────────────────────────────

describe('PERMANENT — /tournaments is indexable', () => {
  it('tournaments/index.vue has no noindex', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).not.toContain('noindex');
  });

  it('tournaments/index.vue has no hardcoded qesb.ir canonical', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

describe('PERMANENT — /tournaments/:slug is indexable for public-safe tournaments', () => {
  it('tournaments/[slug].vue has no static blanket noindex', () => {
    const src = readPage('tournaments/[slug].vue');
    // Static permanent noindex is forbidden. Conditional noindex,follow for 404 is allowed.
    expect(src).not.toContain("'noindex,nofollow'");
  });

  it('tournaments/[slug].vue has no hardcoded qesb.ir canonical', () => {
    const src = readPage('tournaments/[slug].vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

describe('PERMANENT — registration pages remain noindex', () => {
  it('/tournaments/[slug]/register.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'register.vue'), 'utf8');
    expect(src).toContain('noindex');
  });

  it('/tournaments/[slug]/my-registration.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'my-registration.vue'), 'utf8');
    expect(src).toContain('noindex');
  });
});

describe('PERMANENT — unrelated public content pages are not noindexed by Slice 8', () => {
  it('news/index.vue is not noindexed', () => {
    const p = join(PAGES_DIR, 'news', 'index.vue');
    if (!existsSync(p)) return;
    const src = readFileSync(p, 'utf8');
    expect(src).not.toContain('noindex,nofollow');
  });

  it('news/[slug].vue is not statically noindexed', () => {
    const p = join(PAGES_DIR, 'news', '[slug].vue');
    if (!existsSync(p)) return;
    const src = readFileSync(p, 'utf8');
    // News detail may have conditional noindex for not-found, but not a blanket static noindex
    expect(src).not.toContain("'noindex,nofollow'");
  });

  it('articles/index.vue is not noindexed', () => {
    const p = join(PAGES_DIR, 'articles', 'index.vue');
    if (!existsSync(p)) return;
    const src = readFileSync(p, 'utf8');
    expect(src).not.toContain('noindex,nofollow');
  });

  it('index.vue (homepage) is not noindexed', () => {
    const p = join(PAGES_DIR, 'index.vue');
    if (!existsSync(p)) return;
    const src = readFileSync(p, 'utf8');
    expect(src).not.toContain('noindex');
  });
});

// ─── List / search separation ─────────────────────────────────────────────────

describe('PERMANENT — usePublicTournaments routes text search to search.tournaments()', () => {
  it('usePublicTournaments.ts imports createTournamentSearchApi', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).toContain('createTournamentSearchApi');
  });

  it('usePublicTournaments.ts imports createTournamentsDiscoveryApi', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('usePublicTournaments.ts calls searchApi.tournaments() when q is present', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).toContain('searchApi.tournaments');
    expect(src).toContain('filter.q');
  });

  it('usePublicTournaments.ts calls tournamentsApi.list() when no q', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).toContain('tournamentsApi.list');
  });

  it('usePublicTournaments.ts does not pass q to tournamentsApi.list()', () => {
    const src = readComposable('usePublicTournaments.ts');
    // The params object for list() must not include q
    const listBlock = src.match(/tournamentsApi\.list\([\s\S]*?\)/)?.[0] ?? '';
    expect(listBlock).not.toContain('q:');
    expect(listBlock).not.toContain("'q'");
  });
});

// ─── Supported formats only ───────────────────────────────────────────────────

describe('PERMANENT — only supported Phase 1 formats in filter UI', () => {
  it('discovery page does not expose swiss format option', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).not.toContain('value="swiss"');
    expect(src).not.toContain("'swiss'");
  });

  it('discovery page does not expose double_elimination format option', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).not.toContain('value="double_elimination"');
    expect(src).not.toContain("'double_elimination'");
  });

  it('discovery page does not expose advanced_bracket_editor format option', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).not.toContain('value="advanced_bracket_editor"');
    expect(src).not.toContain("'advanced_bracket_editor'");
  });

  it('discovery page exposes only supported format values (single_elimination, round_robin, manual)', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).toContain('value="single_elimination"');
    expect(src).toContain('value="round_robin"');
    expect(src).toContain('value="manual"');
  });
});

// ─── No placeholder / coming-soon UI ─────────────────────────────────────────

describe('PERMANENT — no placeholder or coming-soon UI in Slice 8 pages', () => {
  it('discovery page has no coming-soon text', () => {
    const src = readPage('tournaments/index.vue');
    // Match "coming soon" or "به زودی" as UI copy, not HTML placeholder= attributes
    expect(src).not.toMatch(/coming.?soon|به زودی/i);
  });

  it('detail page has no coming-soon text', () => {
    const src = readPage('tournaments/[slug].vue');
    expect(src).not.toMatch(/coming.?soon|به زودی/i);
  });

  it('TournamentCard.vue has no coming-soon text', () => {
    const src = readCard();
    expect(src).not.toMatch(/coming.?soon|به زودی/i);
  });
});

// ─── No operational SDK in Slice 8 pages ─────────────────────────────────────

describe('PERMANENT — no public operational SDK usage in Slice 8 composables', () => {
  it('usePublicTournaments.ts does not call getParticipants', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toContain('getParticipants');
  });

  it('usePublicTournaments.ts does not call getMatches', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toContain('getMatches');
  });

  it('usePublicTournaments.ts does not call getResults', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toContain('getResults');
  });

  it('usePublicTournaments.ts does not call getStandings', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toContain('getStandings');
  });

  it('usePublicTournaments.ts does not call getBracket', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toContain('getBracket');
  });

  it('useTournamentDetail.ts does not call getParticipants', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toContain('getParticipants');
  });

  it('useTournamentDetail.ts does not call getMatches', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toContain('getMatches');
  });

  it('useTournamentDetail.ts does not call getResults', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toContain('getResults');
  });

  it('useTournamentDetail.ts does not call getStandings', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toContain('getStandings');
  });

  it('useTournamentDetail.ts does not call getBracket', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toContain('getBracket');
  });
});

// ─── Analytics event name ─────────────────────────────────────────────────────

describe('PERMANENT — analytics event name must be exact (tournament.viewed)', () => {
  it('useTournamentDetail.ts references tournament.viewed', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).toContain('tournament.viewed');
  });

  it('useTournamentDetail.ts does not use tournament_viewed (forbidden variant)', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/'tournament_viewed'/);
  });

  it('useTournamentDetail.ts does not use tournament.detail_viewed (forbidden variant)', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/'tournament\.detail_viewed'/);
  });

  it('useTournamentDetail.ts does not use tournament_view (forbidden variant)', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/'tournament_view'/);
  });
});

// ─── No hardcoded origins in Slice 8 composables ─────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in Slice 8 composables', () => {
  it('usePublicTournaments.ts has no hardcoded origin', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('useTournamentDetail.ts has no hardcoded origin', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── No direct fetch in Slice 8 composables ───────────────────────────────────

describe('PERMANENT — no direct fetch/axios in Slice 8 composables', () => {
  it('usePublicTournaments.ts has no direct $fetch or axios', () => {
    const src = readComposable('usePublicTournaments.ts');
    // Match $fetch() or axios.x but not the composable's own `fetch` function declaration
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\./);
  });

  it('useTournamentDetail.ts has no direct $fetch or axios', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });
});

// ─── Cancelled visibility policy ─────────────────────────────────────────────

describe('PERMANENT — cancelled tournaments are visible but non-actionable', () => {
  it('TournamentCard.vue shows cancelled status badge', () => {
    const src = readCard();
    expect(src).toContain('cancelled');
  });

  it('TournamentCard.vue suppresses navigation CTA for cancelled tournaments', () => {
    const src = readCard();
    // v-if guards the NuxtLink CTA
    expect(src).toContain('isCancelled');
    expect(src).toContain('v-if="!isCancelled"');
  });

  it('TournamentCard.vue shows text label instead of link for cancelled tournaments', () => {
    const src = readCard();
    // v-else branch: a plain non-clickable element for cancelled
    expect(src).toContain('v-else');
    expect(src).toContain('cancelled-note');
  });

  it('detail page handles cancelled CTA state as non-actionable', () => {
    const src = readPage('tournaments/[slug].vue');
    expect(src).toContain("ctaState === 'cancelled'");
    // Cancelled block must not contain dr-btn-primary
    const cancelledBlock = src.match(/ctaState === 'cancelled'[\s\S]*?<\/template>/)?.[0] ?? '';
    expect(cancelledBlock).not.toContain('dr-btn-primary');
  });
});

// ─── registrationOpen policy ──────────────────────────────────────────────────

describe('PERMANENT — registrationOpen filter semantics', () => {
  it('usePublicTournaments.ts passes registrationOpen to structured list params', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).toContain('registrationOpen');
  });

  it('usePublicTournaments.ts does not hardcode a fake capacity or registration count', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toMatch(/fakeCount|mockCount|registeredCount\s*=\s*\d/);
  });

  it('discovery page checkbox passes registrationOpen filter (not a fake local filter)', () => {
    const src = readPage('tournaments/index.vue');
    expect(src).toContain('registrationOpen');
    // Must not implement a client-side fake filter
    expect(src).not.toMatch(/\.filter\(.*registrationOpen/);
  });
});

// ─── No fake data in Slice 8 components ──────────────────────────────────────

describe('PERMANENT — no fake tournament data in Slice 8 components', () => {
  it('TournamentCard.vue has no hardcoded tournament title or ID', () => {
    const src = readCard();
    expect(src).not.toMatch(/Dragon Cup|dragon-cup/);
  });

  it('TournamentCard.vue has no fake registration count', () => {
    const src = readCard();
    expect(src).not.toMatch(/fakeCount|mockCount/);
  });

  it('usePublicTournaments.ts has no hardcoded tournament data', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toMatch(/Dragon Cup|dragon-cup|fake|FAKE|seedData/);
  });
});

// ─── No prize/payment/shop in Slice 8 composables ────────────────────────────

describe('PERMANENT — no prize, payment, or shop in Slice 8 composables', () => {
  it('usePublicTournaments.ts has no prize/payment/shop', () => {
    const src = readComposable('usePublicTournaments.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('useTournamentDetail.ts has no prize/payment/shop', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('TournamentCard.vue has no prize/payment/shop', () => {
    const src = readCard();
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});
