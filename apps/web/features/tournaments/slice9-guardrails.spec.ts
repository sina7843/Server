/**
 * Slice 9 guardrails — Public participants and matches views.
 *
 * Permanent guardrails (never remove):
 *   - /tournaments/:slug/participants route exists
 *   - /tournaments/:slug/matches route exists (matches.vue or matches/index.vue)
 *   - No /tournaments/:slug/matches/:matchId route (public match detail forbidden)
 *   - No /tournaments/:slug/matches/:id route
 *   - SDK-only data access (getParticipants, getMatches)
 *   - No direct fetch/$fetch/axios in Slice 9 composables
 *   - No admin SDK in Slice 9 composables
 *   - No public mutation SDK in Slice 9 pages
 *   - No public match detail SDK method
 *   - Participants from approved/active projection (getParticipants only)
 *   - No participant management actions in participants page
 *   - No sensitive participant data (phone, email, userId, internal fields)
 *   - No clickable match detail links in matches page
 *   - No fake participants or fake matches
 *   - No placeholder/coming-soon UI
 *   - No hardcoded localhost or qesb.ir
 *   - Registration routes remain noindex
 *   - analytics event 'tournament.match_viewed' (exact) in useTournamentMatches
 *   - Compact tournament context only (no full detail duplication)
 *   - No /api/v1/tournaments/:slug/matches/:matchId backend endpoint
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

describe('PERMANENT — Slice 9 required public routes exist', () => {
  it('/tournaments/[slug]/participants.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'participants.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/matches.vue or matches/index.vue exists (at least one)', () => {
    const flat = existsSync(join(SLUG_DIR, 'matches.vue'));
    const nested = existsSync(join(SLUG_DIR, 'matches', 'index.vue'));
    expect(flat || nested).toBe(true);
  });
});

// ─── Forbidden match detail routes ────────────────────────────────────────────

describe('PERMANENT — no public match detail routes (forbidden forever)', () => {
  it('no /tournaments/[slug]/matches/[matchId].vue', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[matchId].vue'))).toBe(false);
  });

  it('no /tournaments/[slug]/matches/[id].vue', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[id].vue'))).toBe(false);
  });
});

// ─── SDK-only data access: composables ───────────────────────────────────────

describe('PERMANENT — useTournamentParticipants.ts uses SDK only', () => {
  it('useTournamentParticipants.ts exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentParticipants.ts'))).toBe(true);
  });

  it('useTournamentParticipants.ts uses createTournamentsDiscoveryApi', () => {
    const src = readComposable('useTournamentParticipants.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('useTournamentParticipants.ts has no direct $fetch or axios', () => {
    const src = readComposable('useTournamentParticipants.ts');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('useTournamentParticipants.ts has no hardcoded origin', () => {
    const src = readComposable('useTournamentParticipants.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('useTournamentParticipants.ts has no admin SDK imports', () => {
    const src = readComposable('useTournamentParticipants.ts');
    expect(src).not.toContain('admin');
    expect(src).not.toContain('Admin');
  });
});

describe('PERMANENT — useTournamentMatches.ts uses SDK only', () => {
  it('useTournamentMatches.ts exists', () => {
    expect(existsSync(join(COMPOSABLES_DIR, 'useTournamentMatches.ts'))).toBe(true);
  });

  it('useTournamentMatches.ts uses createTournamentsDiscoveryApi', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
  });

  it('useTournamentMatches.ts has no direct $fetch or axios', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('useTournamentMatches.ts has no hardcoded origin', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('useTournamentMatches.ts has no admin SDK imports', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toContain('admin');
    expect(src).not.toContain('Admin');
  });
});

// ─── Analytics event name ─────────────────────────────────────────────────────

describe('PERMANENT — analytics event name must be exact (tournament.match_viewed)', () => {
  it('useTournamentMatches.ts references tournament.match_viewed', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).toContain('tournament.match_viewed');
  });

  it('useTournamentMatches.ts does not use match_viewed (forbidden variant)', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/'match_viewed'/);
  });

  it('useTournamentMatches.ts does not use tournament_match_viewed (forbidden variant)', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/'tournament_match_viewed'/);
  });

  it('useTournamentMatches.ts does not use tournament.matches_viewed (forbidden variant)', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/'tournament\.matches_viewed'/);
  });

  it('useTournamentMatches.ts does not use tournament.matchListViewed (forbidden variant)', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/'tournament\.matchListViewed'/);
  });
});

// ─── Participants page: SDK usage ─────────────────────────────────────────────

describe('PERMANENT — participants page uses getParticipants() SDK only', () => {
  it('participants.vue calls getParticipants', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('getParticipants');
  });

  it('participants.vue does not call getMyRegistration or mutation SDK', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain('getMyRegistration');
    expect(src).not.toContain('register(');
    expect(src).not.toContain('updateMyRegistration');
    expect(src).not.toContain('withdrawMyRegistration');
  });

  it('participants.vue has no direct $fetch or axios', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\./);
  });

  it('participants.vue uses useTournamentParticipants composable', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('useTournamentParticipants');
  });

  it('participants.vue does not use admin SDK or admin composables', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/adminApi|admin-sdk|AdminSdk|useAdmin/i);
  });
});

// ─── Participants page: no sensitive data leakage ─────────────────────────────

describe('PERMANENT — participants page does not expose sensitive data', () => {
  it('participants.vue does not reference userId field', () => {
    const src = slugPage('participants.vue');
    // Must not render userId as display data
    expect(src).not.toMatch(/\.userId\b/);
  });

  it('participants.vue does not reference phone or email fields', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/\.phone\b|\.email\b/);
  });

  it('participants.vue does not reference internal registration fields', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain('rejectedReason');
    expect(src).not.toContain('participantRemovedAt');
    expect(src).not.toContain('participantDisqualifiedAt');
  });

  it('participants.vue does not expose admin notes', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain('adminNotes');
    expect(src).not.toContain('admin_notes');
  });
});

// ─── Participants page: no mutation actions ───────────────────────────────────

describe('PERMANENT — participants page has no mutation or management actions', () => {
  it('participants.vue has no remove/disqualify actions', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain('removeParticipant');
    expect(src).not.toContain('disqualifyParticipant');
  });

  it('participants.vue has no registration approval/reject actions', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain('approve');
    expect(src).not.toContain('reject(');
  });
});

// ─── Participants page: empty state ──────────────────────────────────────────

describe('PERMANENT — participants page has honest empty state', () => {
  it('participants.vue has empty state (no participants yet)', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('!participants.length');
  });

  it('participants.vue empty state is not a fake placeholder', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|placeholder/i);
    expect(src).not.toMatch(/coming.?soon|به زودی/i);
  });
});

// ─── Participants page: loading/error/not-found states ───────────────────────

describe('PERMANENT — participants page covers all required states', () => {
  it('participants.vue has loading state', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('pending');
  });

  it('participants.vue has error state', () => {
    const src = slugPage('participants.vue');
    expect(src.toLowerCase()).toContain('error');
  });

  it('participants.vue has not-found state', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('notFound');
  });
});

// ─── Matches page: SDK usage ──────────────────────────────────────────────────

describe('PERMANENT — matches page uses getMatches() SDK only', () => {
  const matchesPage = (): string => {
    if (existsSync(join(SLUG_DIR, 'matches.vue'))) return slugPage('matches.vue');
    return readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
  };

  it('matches page calls getMatches', () => {
    const src = matchesPage();
    expect(src).toContain('getMatches');
  });

  it('matches page has no direct $fetch or axios', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\./);
  });

  it('matches page uses useTournamentMatches composable', () => {
    const src = matchesPage();
    expect(src).toContain('useTournamentMatches');
  });

  it('matches page does not use admin SDK', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/adminApi|admin-sdk|AdminSdk|useAdmin/i);
  });

  it('matches page does not call mutation SDK methods', () => {
    const src = matchesPage();
    expect(src).not.toContain('register(');
    expect(src).not.toContain('updateMyRegistration');
    expect(src).not.toContain('withdrawMyRegistration');
  });
});

// ─── Matches page: no clickable match detail links ────────────────────────────

describe('PERMANENT — matches page has no clickable match detail links', () => {
  const matchesPage = (): string => {
    if (existsSync(join(SLUG_DIR, 'matches.vue'))) return slugPage('matches.vue');
    return readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
  };

  it('matches page has no NuxtLink to match detail', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/\/matches\/\$\{|\/matches\/"\s*\+|\/matches\/`\$\{/);
    expect(src).not.toMatch(/matchId|match\.id.*NuxtLink|NuxtLink.*matchId/);
  });

  it('matches page has no href pointing to individual match', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/href.*\/matches\//);
  });

  it('matches page has no to="...matches/:id" style route', () => {
    const src = matchesPage();
    // No dynamic match detail navigation
    expect(src).not.toMatch(/to=.*matches.*match\.id/);
    expect(src).not.toMatch(/:to=.*matches.*match\.id/);
  });
});

// ─── Matches page: no live scoring / mutations ────────────────────────────────

describe('PERMANENT — matches page has no live scoring, mutations, or admin controls', () => {
  const matchesPage = (): string => {
    if (existsSync(join(SLUG_DIR, 'matches.vue'))) return slugPage('matches.vue');
    return readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
  };

  it('matches page has no WebSocket or live scoring references', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/WebSocket|socket\.io|pusher|ably|liveScore/i);
  });

  it('matches page has no match update/cancel/create actions', () => {
    const src = matchesPage();
    expect(src).not.toContain('updateMatch');
    expect(src).not.toContain('cancelMatch');
    expect(src).not.toContain('createMatch');
    expect(src).not.toContain('recordResult');
  });
});

// ─── Matches page: empty state ────────────────────────────────────────────────

describe('PERMANENT — matches page has honest empty state', () => {
  const matchesPage = (): string => {
    if (existsSync(join(SLUG_DIR, 'matches.vue'))) return slugPage('matches.vue');
    return readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
  };

  it('matches page has empty state (no matches yet)', () => {
    const src = matchesPage();
    expect(src).toContain('!matches.length');
  });

  it('matches page empty state is not a fake placeholder', () => {
    const src = matchesPage();
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|placeholder/i);
    expect(src).not.toMatch(/coming.?soon|به زودی/i);
  });
});

// ─── Matches page: match status badges ───────────────────────────────────────

describe('PERMANENT — matches page renders match status badges', () => {
  const matchesPage = (): string => {
    if (existsSync(join(SLUG_DIR, 'matches.vue'))) return slugPage('matches.vue');
    return readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
  };

  it('matches page handles scheduled status', () => {
    const src = matchesPage();
    expect(src).toContain('scheduled');
  });

  it('matches page handles in_progress status', () => {
    const src = matchesPage();
    expect(src).toContain('in_progress');
  });

  it('matches page handles completed status', () => {
    const src = matchesPage();
    expect(src).toContain('completed');
  });

  it('matches page handles cancelled status', () => {
    const src = matchesPage();
    expect(src).toContain('cancelled');
  });
});

// ─── SEO guardrails ───────────────────────────────────────────────────────────

describe('PERMANENT — Slice 9 pages have correct SEO', () => {
  it('participants.vue uses useHead', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('useHead');
  });

  it('participants.vue conditionally noindexes not-found state', () => {
    const src = slugPage('participants.vue');
    expect(src).toContain('noindex');
  });

  it('participants.vue has no static blanket noindex,nofollow', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toContain("'noindex,nofollow'");
  });

  it('participants.vue has no hardcoded qesb.ir', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/qesb\.ir/);
  });

  it('matches page uses useHead', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).toContain('useHead');
  });

  it('matches page conditionally noindexes not-found state', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).toContain('noindex');
  });

  it('matches page has no static blanket noindex,nofollow', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).not.toContain("'noindex,nofollow'");
  });

  it('matches page has no hardcoded qesb.ir', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).not.toMatch(/qesb\.ir/);
  });
});

// ─── Registration pages remain noindex ───────────────────────────────────────

describe('PERMANENT — registration pages remain noindex (Slice 9 must not break this)', () => {
  it('/tournaments/[slug]/register.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'register.vue'), 'utf8');
    expect(src).toContain('noindex');
  });

  it('/tournaments/[slug]/my-registration.vue has noindex', () => {
    const src = readFileSync(join(SLUG_DIR, 'my-registration.vue'), 'utf8');
    expect(src).toContain('noindex');
  });
});

// ─── No fake data ─────────────────────────────────────────────────────────────

describe('PERMANENT — no fake or seed data in Slice 9', () => {
  it('participants.vue has no hardcoded participant data', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seedData/);
    expect(src).not.toMatch(/\bAlice\b|\bBob\b/);
  });

  it('matches page has no hardcoded match data', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seedData/);
  });

  it('useTournamentParticipants.ts has no fake data', () => {
    const src = readComposable('useTournamentParticipants.ts');
    expect(src).not.toMatch(/fake|FAKE|seedData/);
  });

  it('useTournamentMatches.ts has no fake data', () => {
    const src = readComposable('useTournamentMatches.ts');
    expect(src).not.toMatch(/fake|FAKE|seedData/);
  });
});

// ─── No prize/payment/shop ────────────────────────────────────────────────────

describe('PERMANENT — no prize, payment, or shop in Slice 9 pages', () => {
  it('participants.vue has no prize/payment/shop', () => {
    const src = slugPage('participants.vue');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('matches page has no prize/payment/shop', () => {
    const src = existsSync(join(SLUG_DIR, 'matches.vue'))
      ? slugPage('matches.vue')
      : readFileSync(join(SLUG_DIR, 'matches', 'index.vue'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── Backend: public participants endpoint ────────────────────────────────────

describe('PERMANENT — backend public participants controller', () => {
  const PARTICIPANTS_DIR = join(API_ROOT, 'tournament-participants');

  it('public-tournament-participants.controller.ts exists', () => {
    expect(existsSync(join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'))).toBe(
      true,
    );
  });

  it('controller uses GET :slug/participants route', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).toContain(':slug/participants');
  });

  it('controller calls isPubliclyVisible guard', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).toContain('isPubliclyVisible');
  });

  it('controller uses toPublicParticipantListResponse projection', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).toContain('toPublicParticipantListResponse');
  });

  it('controller has no auth guard (public read endpoint)', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).not.toContain('AccessTokenGuard');
    expect(src).not.toContain('PermissionGuard');
  });

  it('controller has no mutation methods (read-only)', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/@Post|@Patch|@Put|@Delete/);
  });

  it('controller has no hardcoded origin', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'public-tournament-participants.controller.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('public projection does not expose userId in response', () => {
    const src = readFileSync(
      join(PARTICIPANTS_DIR, 'tournament-participant-projection.ts'),
      'utf8',
    );
    const publicFn = src.match(/export function toParticipantPublicDto[\s\S]*?^}/m)?.[0] ?? '';
    expect(publicFn).not.toContain('userId:');
  });
});

// ─── Backend: no public match detail endpoint ─────────────────────────────────

describe('PERMANENT — no public match detail API endpoint', () => {
  const MATCHES_DIR = join(API_ROOT, 'tournament-matches');

  it('no matches/[matchId] pattern in public matches controller', () => {
    const src = readFileSync(join(MATCHES_DIR, 'public-tournament-matches.controller.ts'), 'utf8');
    expect(src).not.toMatch(/matches\/:matchId|matchId.*@Param/);
  });

  it('public matches controller has no single-match GET endpoint', () => {
    const src = readFileSync(join(MATCHES_DIR, 'public-tournament-matches.controller.ts'), 'utf8');
    // Only the list endpoint (`:slug/matches`) is allowed — no `:slug/matches/:id`
    expect(src).not.toMatch(/@Get\s*\(\s*['"`]:slug\/matches\/:?match/);
  });
});

// ─── Results / standings / bracket pages exist (Slice 9.2 + 9.3) ─────────────

describe('PERMANENT — results, standings, and bracket pages exist', () => {
  it('/tournaments/[slug]/results.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/standings.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(true);
  });

  it('/tournaments/[slug]/bracket.vue exists', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket.vue'))).toBe(true);
  });
});
