/**
 * Task 6.3 guardrails — Registration UI domain.
 *
 * Permanent guardrails (never remove):
 *   - Both registration pages must be noindex
 *   - No direct $fetch/fetch/axios in registration feature code
 *   - No payment, prize, or shop references in registration feature
 *   - No fake/seed data in registration feature
 *   - SDK (createTournamentsClient) is used — no direct API calls
 *   - No independent Team, Club, or Organization component or model
 *   - PERMANENT FORBIDDEN: /tournaments/[slug]/matches/[matchId] (match detail route)
 *
 * Temporary Slice-6 precondition checks (remove when feature slice lands):
 *   - No full public tournament detail page /tournaments/[slug]/index.vue  → remove when Slice 8 lands
 *   - No /tournaments/[slug]/participants.vue                               → remove when participants page lands
 *   - No /tournaments/[slug]/matches.vue                                    → remove when matches page lands
 *   - No /tournaments/[slug]/results.vue                                    → remove when results page lands
 *   - No /tournaments/[slug]/standings.vue                                  → remove when standings page lands
 *   - No /tournaments/[slug]/bracket.vue                                    → remove when bracket page lands
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const SLUG_DIR = join(__dirname, '../../pages/tournaments/[slug]');
const FEATURES_DIR = join(__dirname);

function readPage(file: string): string {
  return readFileSync(join(SLUG_DIR, file), 'utf8');
}

function readFeature(file: string): string {
  return readFileSync(join(FEATURES_DIR, file), 'utf8');
}

// ─── Required route files exist ──────────────────────────────────────────────

describe('required registration routes exist', () => {
  it('register.vue page exists', () => {
    expect(existsSync(join(SLUG_DIR, 'register.vue'))).toBe(true);
  });

  it('my-registration.vue page exists', () => {
    expect(existsSync(join(SLUG_DIR, 'my-registration.vue'))).toBe(true);
  });
});

// ─── TEMPORARY Slice-6 preconditions — remove when future slice lands ────────
//
// These checks verify that optional future routes have not been accidentally
// created in Slice 6. They are NOT permanent — remove each one as the
// corresponding slice adds the route.

describe('TEMPORARY — Slice-6 route preconditions (remove when feature slice lands)', () => {
  // TEMPORARY: remove when Slice 8 adds the public tournament detail page.
  it('TEMPORARY — no full tournament detail page /tournaments/[slug]/index.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'index.vue'))).toBe(false);
  });

  // TEMPORARY: remove when public participant listing page is added.
  it('TEMPORARY — no /tournaments/[slug]/participants.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'participants.vue'))).toBe(false);
  });

  // TEMPORARY: remove when public match listing page is added.
  it('TEMPORARY — no /tournaments/[slug]/matches.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'matches.vue'))).toBe(false);
  });

  // TEMPORARY: remove when public results page is added.
  it('TEMPORARY — no /tournaments/[slug]/results.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'results.vue'))).toBe(false);
  });

  // TEMPORARY: remove when public standings page is added.
  it('TEMPORARY — no /tournaments/[slug]/standings.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'standings.vue'))).toBe(false);
  });

  // TEMPORARY: remove when public bracket page is added.
  it('TEMPORARY — no /tournaments/[slug]/bracket.vue', () => {
    expect(existsSync(join(SLUG_DIR, 'bracket.vue'))).toBe(false);
  });
});

// ─── PERMANENT forbidden routes ───────────────────────────────────────────────
//
// These routes are permanently forbidden. Do NOT remove these checks.

describe('PERMANENT — forbidden public routes (never remove)', () => {
  // PERMANENT: /tournaments/:slug/matches/:matchId is forbidden in Phase 1.
  it('PERMANENT — no /tournaments/[slug]/matches directory (public match detail is forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches'))).toBe(false);
  });
});

// ─── Both registration pages are noindex ─────────────────────────────────────

describe('registration pages — noindex SEO requirement', () => {
  it('register.vue has noindex meta', () => {
    const src = readPage('register.vue');
    expect(src).toContain('noindex');
  });

  it('my-registration.vue has noindex meta', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('noindex');
  });

  it('register.vue uses useHead for meta tags', () => {
    const src = readPage('register.vue');
    expect(src).toContain('useHead');
  });

  it('my-registration.vue uses useHead for meta tags', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('useHead');
  });
});

// ─── SDK-only data access ─────────────────────────────────────────────────────

describe('registration feature — SDK-only data access', () => {
  it('registration-api.ts uses createTournamentsClient', () => {
    const src = readFeature('registration-api.ts');
    expect(src).toContain('createTournamentsClient');
  });

  it('registration-api.ts has no hardcoded localhost or qesb.ir', () => {
    const src = readFeature('registration-api.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('register.vue has no direct $fetch or axios calls', () => {
    const src = readPage('register.vue');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('PERMANENT — register.vue does not call getBySlug (no full public tournament detail dependency)', () => {
    const src = readPage('register.vue');
    expect(src).not.toContain('getBySlug');
  });

  it('my-registration.vue has no direct $fetch or axios calls', () => {
    const src = readPage('my-registration.vue');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('registration-api.ts has no direct $fetch or axios calls', () => {
    const src = readFeature('registration-api.ts');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\./);
  });
});

// ─── Permanent: no payment/prize/shop ────────────────────────────────────────

describe('permanent guardrail — no payment, prize, or shop', () => {
  it('registration-api.ts has no payment/prize/shop', () => {
    const src = readFeature('registration-api.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('registration.types.ts has no payment/prize/shop', () => {
    const src = readFeature('registration.types.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('registration.validation.ts has no payment/prize/shop', () => {
    const src = readFeature('registration.validation.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('register.vue has no payment/prize/shop', () => {
    const src = readPage('register.vue');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('my-registration.vue has no payment/prize/shop', () => {
    const src = readPage('my-registration.vue');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── Permanent: no match/bracket/standing ────────────────────────────────────

describe('permanent guardrail — no match/bracket/standing in registration pages', () => {
  it('register.vue has no match/bracket/standing service references', () => {
    const src = readPage('register.vue');
    expect(src).not.toMatch(/MatchService|BracketService|StandingService/);
  });

  it('my-registration.vue has no match/bracket/standing service references', () => {
    const src = readPage('my-registration.vue');
    expect(src).not.toMatch(/MatchService|BracketService|StandingService/);
  });
});

// ─── Permanent: no fake/seed data ────────────────────────────────────────────

describe('permanent guardrail — no fake or seed data', () => {
  it('registration-api.ts has no fake data', () => {
    const src = readFeature('registration-api.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('registration.types.ts has no fake data', () => {
    const src = readFeature('registration.types.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
  });

  it('no registration seed file exists', () => {
    expect(existsSync(join(FEATURES_DIR, 'registration-seed.ts'))).toBe(false);
    expect(existsSync(join(FEATURES_DIR, 'seeds'))).toBe(false);
  });
});

// ─── No independent Team/Club/Organization ────────────────────────────────────

describe('permanent guardrail — no independent Team, Club, or Organization', () => {
  it('no team schema or model file in registrations feature', () => {
    expect(existsSync(join(FEATURES_DIR, 'team.ts'))).toBe(false);
    expect(existsSync(join(FEATURES_DIR, 'team.schema.ts'))).toBe(false);
  });

  it('no club schema or model file in registrations feature', () => {
    expect(existsSync(join(FEATURES_DIR, 'club.ts'))).toBe(false);
  });

  it('no organization schema or model file in registrations feature', () => {
    expect(existsSync(join(FEATURES_DIR, 'organization.ts'))).toBe(false);
  });
});

// ─── Auth state handling ──────────────────────────────────────────────────────

describe('registration pages — auth state handling', () => {
  it('register.vue handles auth_required state (not hard redirect only)', () => {
    const src = readPage('register.vue');
    expect(src).toContain('auth_required');
    expect(src).toContain('AuthRequiredState');
  });

  it('my-registration.vue handles auth_required state', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('auth_required');
    expect(src).toContain('AuthRequiredState');
  });
});

// ─── Registration states covered ─────────────────────────────────────────────

describe('register.vue — all required states covered', () => {
  it('handles loading state', () => {
    const src = readPage('register.vue');
    expect(src).toContain("'loading'");
  });

  it('handles closed state', () => {
    const src = readPage('register.vue');
    expect(src).toContain('closed');
    expect(src).toContain('RegistrationClosedState');
  });

  it('handles capacity_full state', () => {
    const src = readPage('register.vue');
    expect(src).toContain('capacity_full');
    expect(src).toContain('CapacityFullState');
  });

  it('handles already_registered state', () => {
    const src = readPage('register.vue');
    expect(src).toContain('already_registered');
    expect(src).toContain('AlreadyRegisteredState');
  });

  it('handles success state', () => {
    const src = readPage('register.vue');
    expect(src).toContain("'success'");
    expect(src).toContain('SuccessState');
  });

  it('renders RegistrationForm for open state', () => {
    const src = readPage('register.vue');
    expect(src).toContain('RegistrationForm');
  });
});

describe('my-registration.vue — all required states covered', () => {
  it('handles loading state', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain("'loading'");
  });

  it('handles not_found state', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('not_found');
  });

  it('handles withdrawn state', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('withdrawn');
  });

  it('renders MyRegistrationPanel for ready state', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('MyRegistrationPanel');
  });

  it('renders WithdrawConfirmDialog', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('WithdrawConfirmDialog');
  });

  it('renders EditRegistrationForm for edit flow', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('EditRegistrationForm');
  });

  it('calls updateMyRegistration for edit submit', () => {
    const src = readPage('my-registration.vue');
    expect(src).toContain('updateMyRegistration');
  });
});

// ─── No hardcoded origins ─────────────────────────────────────────────────────

describe('permanent guardrail — no hardcoded localhost or qesb.ir in pages', () => {
  it('register.vue has no hardcoded origin', () => {
    const src = readPage('register.vue');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('my-registration.vue has no hardcoded origin', () => {
    const src = readPage('my-registration.vue');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});
