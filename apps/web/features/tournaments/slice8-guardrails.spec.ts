/**
 * Slice 8 web guardrails — Public tournament discovery.
 *
 * Permanent guardrails (never remove):
 *   - tournaments/index.vue must exist (discovery page)
 *   - tournaments/index.vue must be indexable (no noindex)
 *   - No direct $fetch/fetch/axios in tournaments feature code
 *   - No hardcoded localhost or qesb.ir in feature code or pages
 *   - No fake/seed data in tournaments feature
 *   - No prize/payment/shop references
 *   - SDK-only data access (createTournamentsClient, createSearchClient, createGamesClient)
 *   - tournaments.list() must not accept q (text search uses search.tournaments())
 *   - No /tournaments/[slug]/index.vue detail page (that is Task 8.3 / Slice 9)
 *   - No /tournaments/index.vue with noindex
 *
 * Temporary Slice-8 precondition checks (labeled TEMPORARY — remove when feature slice lands):
 *   - No /tournaments/[slug]/index.vue — TEMPORARY: remove when Task 8.3 adds the detail page
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const WEB_ROOT = join(__dirname, '../..');
const PAGES_DIR = join(WEB_ROOT, 'pages');
const SLUG_DIR = join(PAGES_DIR, 'tournaments', '[slug]');
const TOURNAMENTS_PAGE = join(PAGES_DIR, 'tournaments', 'index.vue');
const FEATURES_DIR = join(__dirname);

function readTournamentsPage(): string {
  return readFileSync(TOURNAMENTS_PAGE, 'utf8');
}

function readFeature(file: string): string {
  return readFileSync(join(FEATURES_DIR, file), 'utf8');
}

// ─── Required route exists ─────────────────────────────────────────────────────

describe('PERMANENT — tournaments discovery page exists', () => {
  it('tournaments/index.vue exists', () => {
    expect(existsSync(TOURNAMENTS_PAGE)).toBe(true);
  });
});

// ─── SEO: indexable ──────────────────────────────────────────────────────────

describe('PERMANENT — tournaments/index.vue is indexable (no noindex)', () => {
  it('tournaments/index.vue has no noindex meta', () => {
    const src = readTournamentsPage();
    expect(src).not.toContain('noindex');
  });

  it('tournaments/index.vue uses useHead for meta tags', () => {
    const src = readTournamentsPage();
    expect(src).toContain('useHead');
  });

  it('tournaments/index.vue has og:title meta', () => {
    const src = readTournamentsPage();
    expect(src).toContain('og:title');
  });

  it('tournaments/index.vue has description meta', () => {
    const src = readTournamentsPage();
    expect(src).toContain('description');
  });
});

// ─── SDK-only data access ─────────────────────────────────────────────────────

describe('PERMANENT — tournaments-api.ts uses SDK only (no direct fetch)', () => {
  it('tournaments-api.ts uses createTournamentsClient', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).toContain('createTournamentsClient');
  });

  it('tournaments-api.ts uses createSearchClient', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).toContain('createSearchClient');
  });

  it('tournaments-api.ts uses createGamesClient', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).toContain('createGamesClient');
  });

  it('tournaments-api.ts has no direct $fetch or axios calls', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\./);
  });

  it('tournaments/index.vue has no direct $fetch or axios calls', () => {
    const src = readTournamentsPage();
    expect(src).not.toMatch(/\$fetch\s*\(|axios\s*\.|fetch\s*\(/);
  });
});

// ─── List/search separation ───────────────────────────────────────────────────

describe('PERMANENT — list and search are separate (no q in list())', () => {
  it('tournaments-api.ts does not pass q to tournaments.list()', () => {
    const src = readFeature('tournaments-api.ts');
    // The list() call must not serialize a q param
    const listFnBody =
      src.match(
        /createTournamentsDiscoveryApi[\s\S]*?export function createTournamentSearchApi/,
      )?.[0] ?? src;
    expect(listFnBody).not.toMatch(/search\.set\(['"]q['"]/);
  });

  it('search.tournaments() is used for text search — tournaments.list() is used for structured filters', () => {
    // Both functions must be present and separate in the API factory file
    const src = readFeature('tournaments-api.ts');
    expect(src).toContain('createTournamentsDiscoveryApi');
    expect(src).toContain('createTournamentSearchApi');
  });
});

// ─── No hardcoded origins ─────────────────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir', () => {
  it('tournaments-api.ts has no hardcoded localhost or qesb.ir', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournaments/index.vue has no hardcoded localhost or qesb.ir', () => {
    const src = readTournamentsPage();
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── No fake/seed data ────────────────────────────────────────────────────────

describe('PERMANENT — no fake or seed data', () => {
  it('tournaments-api.ts has no fake data', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('no tournaments seed file exists', () => {
    expect(existsSync(join(FEATURES_DIR, 'tournaments-seed.ts'))).toBe(false);
    expect(existsSync(join(FEATURES_DIR, 'seeds'))).toBe(false);
  });

  it('tournaments/index.vue has no hardcoded tournament title or ID', () => {
    const src = readTournamentsPage();
    expect(src).not.toMatch(/Dragon Cup|dragon-cup/);
  });
});

// ─── No payment/prize/shop ────────────────────────────────────────────────────

describe('PERMANENT — no payment, prize, or shop references', () => {
  it('tournaments-api.ts has no payment/prize/shop', () => {
    const src = readFeature('tournaments-api.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('tournaments/index.vue has no payment/prize/shop', () => {
    const src = readTournamentsPage();
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── No cancelled tournament actionable CTA ───────────────────────────────────

describe('PERMANENT — cancelled tournaments are marked but non-actionable', () => {
  it('TournamentCard.vue exists', () => {
    expect(existsSync(join(WEB_ROOT, 'components', 'tournaments', 'TournamentCard.vue'))).toBe(
      true,
    );
  });

  it('TournamentCard.vue has cancelled marking', () => {
    const src = readFileSync(
      join(WEB_ROOT, 'components', 'tournaments', 'TournamentCard.vue'),
      'utf8',
    );
    expect(src).toContain('cancelled');
  });

  it('TournamentCard.vue suppresses CTA for cancelled tournaments (v-if not isCancelled)', () => {
    const src = readFileSync(
      join(WEB_ROOT, 'components', 'tournaments', 'TournamentCard.vue'),
      'utf8',
    );
    expect(src).toContain('isCancelled');
  });
});

// ─── Required states covered ──────────────────────────────────────────────────

describe('PERMANENT — tournaments/index.vue covers all required states', () => {
  it('has loading state', () => {
    const src = readTournamentsPage();
    expect(src).toContain('loading');
  });

  it('has error state', () => {
    const src = readTournamentsPage();
    expect(src).toContain('error');
  });

  it('has empty state (no results)', () => {
    const src = readTournamentsPage();
    expect(src).toContain('items.length === 0');
  });

  it('has no-results state with filter clear option', () => {
    const src = readTournamentsPage();
    expect(src).toContain('clearFilters');
  });
});

// ─── Public-safe status filters only ─────────────────────────────────────────

describe('PERMANENT — only public-safe statuses in filter UI', () => {
  it('tournaments/index.vue does not offer draft status in filter', () => {
    const src = readTournamentsPage();
    expect(src).not.toContain('value="draft"');
  });

  it('tournaments/index.vue does not offer archived status in filter', () => {
    const src = readTournamentsPage();
    expect(src).not.toContain('value="archived"');
  });
});

// ─── PERMANENT: detail page exists (Task 8.3) ────────────────────────────────

describe('PERMANENT — /tournaments/[slug].vue detail page exists (Task 8.3)', () => {
  it('PERMANENT — /tournaments/[slug].vue detail page exists', () => {
    expect(existsSync(join(PAGES_DIR, 'tournaments', '[slug].vue'))).toBe(true);
  });

  it('PERMANENT — no /tournaments/[slug]/index.vue nested variant', () => {
    expect(existsSync(join(SLUG_DIR, 'index.vue'))).toBe(false);
  });
});
