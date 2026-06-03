/**
 * Slice 6 web hardening — Registration UI domain.
 *
 * Permanent guardrails (never remove):
 *   - Unrelated public content/news pages must NOT be noindexed
 *   - PERMANENT FORBIDDEN: /tournaments/[slug]/matches/[matchId] (match detail only)
 *   - /tournaments/[slug]/matches and /tournaments/[slug]/matches/index are NOT permanently forbidden
 *     (legal Slice 9 list routes; covered by TEMPORARY checks — remove when Slice 9 lands)
 *   - PERMANENT FORBIDDEN: admin /tournaments/[id]/operations standalone page
 *   - PERMANENT FORBIDDEN: admin /tournaments/[id]/preview standalone page
 *   - No raw permission strings in registration feature web code
 *   - analytics event name tournament.registration_started must be used if tracked
 *
 * Temporary Slice-6 checks (labeled — remove when future slice lands):
 *   - Guardrail file documents its TEMPORARY labels for precondition checks
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const WEB_ROOT = join(__dirname, '../..');
const PAGES_DIR = join(WEB_ROOT, 'pages');
const SLUG_DIR = join(PAGES_DIR, 'tournaments', '[slug]');
const FEATURES_DIR = join(__dirname);
const REPO_ROOT = join(__dirname, '../../../..');
const ADMIN_TOURNAMENT_PAGES = join(REPO_ROOT, 'apps', 'admin', 'pages', 'tournaments', '[id]');

function readPage(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

function readFeature(file: string): string {
  return readFileSync(join(FEATURES_DIR, file), 'utf8');
}

// ─── Unrelated public pages must NOT be noindexed ────────────────────────────

describe('PERMANENT — unrelated public content pages are indexable (not noindexed)', () => {
  it('news index page has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'news', 'index.vue'));
    expect(src).not.toContain('noindex');
  });

  it('news detail page has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'news', '[slug].vue'));
    expect(src).not.toContain('noindex');
  });

  it('articles index page has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'articles', 'index.vue'));
    expect(src).not.toContain('noindex');
  });

  it('articles detail page has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'articles', '[slug].vue'));
    expect(src).not.toContain('noindex');
  });

  it('home page (index.vue) has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'index.vue'));
    expect(src).not.toContain('noindex');
  });

  it('search page has no noindex meta', () => {
    const src = readPage(join(PAGES_DIR, 'search.vue'));
    expect(src).not.toContain('noindex');
  });
});

// ─── PERMANENT forbidden admin standalone routes do not exist ─────────────────

describe('PERMANENT — forbidden admin standalone tournament routes do not exist', () => {
  // PERMANENT: /tournaments/:id/operations as a standalone page is forbidden.
  it('PERMANENT — no admin /tournaments/[id]/operations.vue page', () => {
    expect(existsSync(join(ADMIN_TOURNAMENT_PAGES, 'operations.vue'))).toBe(false);
  });

  // PERMANENT: /tournaments/:id/preview as a standalone page is forbidden.
  it('PERMANENT — no admin /tournaments/[id]/preview.vue page', () => {
    expect(existsSync(join(ADMIN_TOURNAMENT_PAGES, 'preview.vue'))).toBe(false);
  });
});

// ─── PERMANENT: no public match detail route ──────────────────────────────────

describe('PERMANENT — public match detail route is forbidden', () => {
  // Only dynamic match detail routes are permanently forbidden.
  // The matches list route (matches.vue or matches/index.vue) is a legal Slice 9 route —
  // it is covered by TEMPORARY checks below; do NOT add a permanent check for the directory.
  it('PERMANENT — no /tournaments/[slug]/matches/[matchId].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[matchId].vue'))).toBe(false);
  });

  it('PERMANENT — no /tournaments/[slug]/matches/[id].vue (public match detail forbidden)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', '[id].vue'))).toBe(false);
  });
});

// ─── TEMPORARY: public matches listing page not yet implemented ───────────────

describe('TEMPORARY — public match listing page is not yet implemented (Slice 6)', () => {
  // TEMPORARY: remove when the public matches listing page lands in a later Phase 1 slice.
  // /tournaments/:slug/matches is a legal future Phase 1 route — do NOT permanently forbid it.
  it('TEMPORARY — no /tournaments/[slug]/matches.vue (remove when matches page lands)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches.vue'))).toBe(false);
  });

  // TEMPORARY: both forms of the Slice 9 list route are not yet implemented.
  it('TEMPORARY — no /tournaments/[slug]/matches/index.vue (remove when matches page lands)', () => {
    expect(existsSync(join(SLUG_DIR, 'matches', 'index.vue'))).toBe(false);
  });
});

// ─── PERMANENT: registration pages remain noindex ─────────────────────────────

describe('PERMANENT — registration pages are noindex', () => {
  it('register.vue is noindex', () => {
    const src = readPage(join(SLUG_DIR, 'register.vue'));
    expect(src).toContain('noindex');
  });

  it('my-registration.vue is noindex', () => {
    const src = readPage(join(SLUG_DIR, 'my-registration.vue'));
    expect(src).toContain('noindex');
  });
});

// ─── PERMANENT: registration guardrails file labels TEMPORARY checks ──────────

describe('PERMANENT — registration guardrails file labels temporary route checks', () => {
  it('guardrails spec file contains TEMPORARY label for precondition checks', () => {
    const src = readFeature('registration-guardrails.spec.ts');
    expect(src).toContain('TEMPORARY');
  });

  it('guardrails spec file contains PERMANENT label for forever-forbidden checks', () => {
    const src = readFeature('registration-guardrails.spec.ts');
    expect(src).toContain('PERMANENT');
  });

  it('guardrails spec file explains that TEMPORARY checks should be removed when slice lands', () => {
    const src = readFeature('registration-guardrails.spec.ts');
    expect(src).toContain('remove when');
  });
});

// ─── PERMANENT: no fake/placeholder/coming-soon pages ─────────────────────────

describe('PERMANENT — no placeholder or coming-soon tournament pages', () => {
  it('no coming-soon.vue page in tournaments slug dir', () => {
    expect(existsSync(join(SLUG_DIR, 'coming-soon.vue'))).toBe(false);
  });

  it('no placeholder.vue page in tournaments slug dir', () => {
    expect(existsSync(join(SLUG_DIR, 'placeholder.vue'))).toBe(false);
  });
});

// ─── PERMANENT: registration feature code has no payment/prize/shop ───────────

describe('PERMANENT — registration pages have no payment, prize, or shop scope', () => {
  it('register.vue has no payment/prize/shop', () => {
    const src = readPage(join(SLUG_DIR, 'register.vue'));
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('my-registration.vue has no payment/prize/shop', () => {
    const src = readPage(join(SLUG_DIR, 'my-registration.vue'));
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── PERMANENT: registration feature uses SDK only ────────────────────────────

describe('PERMANENT — registration pages use SDK only (no direct fetch)', () => {
  it('register.vue has no direct $fetch or axios calls', () => {
    const src = readPage(join(SLUG_DIR, 'register.vue'));
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('my-registration.vue has no direct $fetch or axios calls', () => {
    const src = readPage(join(SLUG_DIR, 'my-registration.vue'));
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });

  it('registration-api.ts uses createTournamentsClient from SDK', () => {
    const src = readFeature('registration-api.ts');
    expect(src).toContain('createTournamentsClient');
  });
});

// ─── PERMANENT: no hardcoded runtime origins ──────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in registration web code', () => {
  it('registration-api.ts has no hardcoded origin', () => {
    const src = readFeature('registration-api.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('register.vue has no hardcoded origin', () => {
    const src = readPage(join(SLUG_DIR, 'register.vue'));
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('my-registration.vue has no hardcoded origin', () => {
    const src = readPage(join(SLUG_DIR, 'my-registration.vue'));
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});
