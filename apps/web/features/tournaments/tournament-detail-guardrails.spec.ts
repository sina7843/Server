/**
 * Task 8.3 guardrails — Public tournament detail page.
 *
 * Permanent guardrails (never remove):
 *   - /tournaments/:slug route file exists at pages/tournaments/[slug].vue
 *   - Detail page is indexable only for public-safe tournaments (no blanket noindex)
 *   - SDK-only: uses tournaments.getBySlug() — no direct fetch
 *   - No public operational SDK methods on detail page
 *   - Renders public-safe fields (title, status, format, participantType, etc.)
 *   - Does not render operational data (participants, matches, results, standings, bracket)
 *   - CTA states: register, view_registration, registration_closed, in_progress, completed, cancelled
 *   - Registration links point only to /register and /my-registration
 *   - Cancelled CTA is non-actionable
 *   - No prize/payment/shop references
 *   - No fake tournament data
 *   - No hardcoded localhost or qesb.ir
 *   - analytics event name 'tournament.viewed' is the only permitted name (integration deferred)
 *   - No public operational pages created (participants, matches, results, standings, bracket)
 *
 * Related:
 *   - slice8-guardrails.spec.ts (discovery page)
 *   - registration-guardrails.spec.ts (registration pages noindex)
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

// ─── Jest globals ─────────────────────────────────────────────────────────────

type WebTestFn = () => void | Promise<void>;

interface WebExpectMatchers {
  readonly not: WebExpectMatchers;
  toBe(expected: unknown): void;
  toContain(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeDefined(): void;
  toMatch(pattern: RegExp | string): void;
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;

// ─── Paths ────────────────────────────────────────────────────────────────────

const WEB_ROOT = join(__dirname, '../..');
const PAGES_DIR = join(WEB_ROOT, 'pages');
const SLUG_DIR = join(PAGES_DIR, 'tournaments', '[slug]');
const DETAIL_PAGE = join(PAGES_DIR, 'tournaments', '[slug].vue');
const COMPOSABLES_DIR = join(WEB_ROOT, 'composables');

function readDetailPage(): string {
  return readFileSync(DETAIL_PAGE, 'utf8');
}

function readComposable(name: string): string {
  return readFileSync(join(COMPOSABLES_DIR, name), 'utf8');
}

// ─── Route exists ─────────────────────────────────────────────────────────────

describe('PERMANENT — /tournaments/:slug detail route exists', () => {
  it('/tournaments/[slug].vue exists', () => {
    expect(existsSync(DETAIL_PAGE)).toBe(true);
  });

  it('useTournamentDetail.ts composable exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentDetail.ts'))).toBe(true);
  });
});

// ─── SEO indexable ────────────────────────────────────────────────────────────

describe('PERMANENT — detail page SEO', () => {
  it('detail page has no static noindex,nofollow (indexable for public-safe tournaments)', () => {
    const src = readDetailPage();
    // Registration pages use static 'noindex,nofollow'; the public detail page must not.
    // The detail page may use conditional noindex,follow only for not-found/error.
    expect(src).not.toContain("'noindex,nofollow'");
  });

  it('detail page uses useHead for SEO metadata', () => {
    const src = readDetailPage();
    expect(src).toContain('useHead');
  });

  it('detail page sets title from tournament data', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.value');
    expect(src).toContain('title');
  });

  it('detail page sets og:title meta', () => {
    const src = readDetailPage();
    expect(src).toContain('og:title');
  });

  it('detail page sets description meta', () => {
    const src = readDetailPage();
    expect(src).toContain('description');
  });

  it('detail page has no hardcoded qesb.ir canonical URL', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/qesb\.ir/);
  });

  it('detail page has no hardcoded localhost', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/localhost/);
  });
});

// ─── SDK-only data access ─────────────────────────────────────────────────────

describe('PERMANENT — SDK-only data access (no direct fetch)', () => {
  it('detail page uses useTournamentDetail composable', () => {
    const src = readDetailPage();
    expect(src).toContain('useTournamentDetail');
  });

  it('useTournamentDetail composable uses createTournamentsDiscoveryApi (wraps createTournamentsClient)', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('detail page calls getBySlug', () => {
    const src = readDetailPage();
    expect(src).toContain('getBySlug');
  });

  it('detail page has no direct $fetch or axios calls', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('useTournamentDetail composable has no hardcoded localhost or qesb.ir', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── No public operational SDK methods ───────────────────────────────────────

describe('PERMANENT — no public operational SDK methods on detail page', () => {
  it('detail page does not call getParticipants', () => {
    const src = readDetailPage();
    expect(src).not.toContain('getParticipants');
  });

  it('detail page does not call getMatches', () => {
    const src = readDetailPage();
    expect(src).not.toContain('getMatches');
  });

  it('detail page does not call getResults', () => {
    const src = readDetailPage();
    expect(src).not.toContain('getResults');
  });

  it('detail page does not call getStandings', () => {
    const src = readDetailPage();
    expect(src).not.toContain('getStandings');
  });

  it('detail page does not call getBracket', () => {
    const src = readDetailPage();
    expect(src).not.toContain('getBracket');
  });
});

// ─── Public-safe fields rendered ─────────────────────────────────────────────

describe('PERMANENT — public-safe fields are rendered', () => {
  it('detail page renders title', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.title');
  });

  it('detail page renders status', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.value.status');
  });

  it('detail page renders format', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.value.format');
  });

  it('detail page renders participantType when set', () => {
    const src = readDetailPage();
    expect(src).toContain('participantType');
  });

  it('detail page renders description when available', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.description');
  });

  it('detail page renders rules when available', () => {
    const src = readDetailPage();
    expect(src).toContain('tournament.rules');
  });

  it('detail page renders registrationOpenAt when available', () => {
    const src = readDetailPage();
    expect(src).toContain('registrationOpenAt');
  });

  it('detail page renders registrationCloseAt when available', () => {
    const src = readDetailPage();
    expect(src).toContain('registrationCloseAt');
  });

  it('detail page renders startsAt when available', () => {
    const src = readDetailPage();
    expect(src).toContain('startsAt');
  });

  it('detail page renders endsAt when available', () => {
    const src = readDetailPage();
    expect(src).toContain('endsAt');
  });

  it('detail page renders capacity', () => {
    const src = readDetailPage();
    expect(src).toContain('capacity');
  });
});

// ─── Operational data not rendered ───────────────────────────────────────────

describe('PERMANENT — operational data is not rendered', () => {
  it('detail page does not render participants list', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/participants\b/);
  });

  it('detail page does not render match list', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\bmatches\b/);
  });

  it('detail page does not render results list', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\bresults\b/);
  });

  it('detail page does not render standings table', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\bstandings\b/);
  });

  it('detail page does not render bracket tree', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\bbracket\b/);
  });

  it('detail page has no fake operational count data', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/fakeCount|mockCount|participantCount\s*=\s*\d/);
  });
});

// ─── CTA states ───────────────────────────────────────────────────────────────

describe('PERMANENT — CTA states are all handled', () => {
  it('detail page handles register CTA', () => {
    const src = readDetailPage();
    expect(src).toContain("'register'");
  });

  it('detail page handles view_registration CTA', () => {
    const src = readDetailPage();
    expect(src).toContain("'view_registration'");
  });

  it('detail page handles registration_closed state', () => {
    const src = readDetailPage();
    expect(src).toContain("'registration_closed'");
  });

  it('detail page handles in_progress state', () => {
    const src = readDetailPage();
    expect(src).toContain("'in_progress'");
  });

  it('detail page handles completed state', () => {
    const src = readDetailPage();
    expect(src).toContain("'completed'");
  });

  it('detail page handles cancelled state (non-actionable)', () => {
    const src = readDetailPage();
    expect(src).toContain("'cancelled'");
  });

  it('cancelled CTA has no clickable register link', () => {
    const src = readDetailPage();
    // When ctaState is cancelled, no dr-btn-primary CTA should be shown
    const cancelledBlock = src.match(/ctaState === 'cancelled'[\s\S]*?<\/template>/)?.[0] ?? '';
    expect(cancelledBlock).not.toContain('dr-btn-primary');
    expect(cancelledBlock).not.toContain('/register');
  });
});

// ─── Registration links ───────────────────────────────────────────────────────

describe('PERMANENT — registration links point only to Slice 6 routes', () => {
  it('register CTA links to /tournaments/:slug/register', () => {
    const src = readDetailPage();
    expect(src).toContain('/register');
  });

  it('view_registration CTA links to /tournaments/:slug/my-registration', () => {
    const src = readDetailPage();
    expect(src).toContain('/my-registration');
  });

  it('detail page has no link to /participants', () => {
    const src = readDetailPage();
    expect(src).not.toContain('/participants');
  });

  it('detail page has no link to /matches', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/\/matches(?!\w)/);
  });

  it('detail page has no link to /results', () => {
    const src = readDetailPage();
    expect(src).not.toContain('/results');
  });

  it('detail page has no link to /standings', () => {
    const src = readDetailPage();
    expect(src).not.toContain('/standings');
  });

  it('detail page has no link to /bracket', () => {
    const src = readDetailPage();
    expect(src).not.toContain('/bracket');
  });
});

// ─── States required ──────────────────────────────────────────────────────────

describe('PERMANENT — all required page states are handled', () => {
  it('detail page has loading state', () => {
    const src = readDetailPage();
    expect(src).toContain('pending');
  });

  it('detail page has error/not-found state', () => {
    const src = readDetailPage();
    expect(src).toContain('isNotFound');
  });

  it('not-found state does not expose internal tournament data', () => {
    const src = readDetailPage();
    // The not-found template must not reference internal fields
    const notFoundBlock = src.match(/state--not-found[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(notFoundBlock).not.toContain('tournament.status');
    expect(notFoundBlock).not.toContain('deletedAt');
    expect(notFoundBlock).not.toContain('draft');
    expect(notFoundBlock).not.toContain('archived');
  });
});

// ─── Analytics event name ─────────────────────────────────────────────────────

describe('PERMANENT — analytics event name correctness', () => {
  it('useTournamentDetail composable references tournament.viewed (exact event name)', () => {
    const src = readComposable('useTournamentDetail.ts');
    expect(src).toContain('tournament.viewed');
  });

  it('no incorrect analytics event names exist in composable (no snake_case or detail_viewed variants)', () => {
    const src = readComposable('useTournamentDetail.ts');
    // Must not use snake_case or incorrect variant as the actual event name in code
    expect(src).not.toMatch(/'tournament_viewed'/);
    expect(src).not.toMatch(/'tournament\.detail_viewed'/);
    expect(src).not.toMatch(/'tournament_view'/);
  });
});

// ─── No operational pages ─────────────────────────────────────────────────────

describe('PERMANENT — no public operational pages exist', () => {
  it('no /tournaments/[slug]/participants.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'participants.vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'matches.vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/results.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/standings.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/bracket.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket.vue'))).toBe(false);
  });

  it('PERMANENT — no /tournaments/[slug]/matches directory (match detail route)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches'))).toBe(false);
  });
});

// ─── No prize/payment/shop ────────────────────────────────────────────────────

describe('PERMANENT — no payment, prize, or shop in detail page', () => {
  it('detail page has no payment/prize/shop', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── No fake data ─────────────────────────────────────────────────────────────

describe('PERMANENT — no fake tournament data', () => {
  it('detail page has no hardcoded tournament title', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/Dragon Cup|dragon-cup/);
  });

  it('detail page has no seed data references', () => {
    const src = readDetailPage();
    expect(src).not.toMatch(/fake|FAKE|seedData|SEED_DATA/);
  });
});
