/**
 * Slice 2 homepage hardening guardrails — web app pages and components.
 *
 * Covers files NOT already scanned by the admin-side guardrail:
 *   - apps/web/pages/  (homepage page files)
 *   - apps/web/components/esports/  (homepage components)
 *
 * Checks:
 *   - homepage SEO metadata is present and config-driven
 *   - no hardcoded deployment-blocking URLs in page/component files
 *   - no unsupported tournament routes linked from homepage
 *   - SSR-compatible data loading pattern
 *   - no fake content / placeholder sections
 *   - no direct fetch in homepage data flow
 *   - esports SDK surface does not expose forbidden tournament methods
 */

// ─── Jest globals (web spec convention) ──────────────────────────────────────

type WebTestFn = () => void | Promise<void>;

interface WebExpectMatchers {
  readonly not: WebExpectMatchers;
  toBe(expected: unknown): void;
  toContain(expected: string): void;
  toBeDefined(): void;
  toMatch(pattern: RegExp | string): void;
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;

// ─── Imports ──────────────────────────────────────────────────────────────────

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createEsportsApi } from './esports-api';

const NUXT_CONFIG_SRC = readFileSync(join(__dirname, '..', '..', 'nuxt.config.ts'), 'utf8');

// ─── File helpers ─────────────────────────────────────────────────────────────

function collectFiles(dir: string, exts: string[]): string[] {
  const result: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.nuxt', '.output', 'dist', '.turbo'].includes(entry.name)) continue;
      result.push(...collectFiles(full, exts));
    } else if (exts.includes(extname(entry.name))) {
      if (!entry.name.endsWith('.spec.ts')) result.push(full);
    }
  }
  return result;
}

function readSrc(file: string): string {
  return readFileSync(file, 'utf8');
}

const WEB_ROOT = join(__dirname, '..', '..');

const INDEX_VUE = readSrc(join(WEB_ROOT, 'pages', 'index.vue'));
const USE_ESPORTS_HOME = readSrc(join(WEB_ROOT, 'composables', 'useEsportsHome.ts'));

// All esports component source files (not covered by admin guardrails)
const ESPORTS_COMPONENT_FILES = collectFiles(join(WEB_ROOT, 'components', 'esports'), ['.vue']);
const ESPORTS_COMPONENT_SRC = ESPORTS_COMPONENT_FILES.map(readSrc);

// All homepage runtime source: index.vue + composable + esports components
const ALL_HOMEPAGE_SRC = [INDEX_VUE, USE_ESPORTS_HOME, ...ESPORTS_COMPONENT_SRC];

// All web page files (for route-link checks)
const WEB_PAGE_FILES = collectFiles(join(WEB_ROOT, 'pages'), ['.vue', '.ts']);
const WEB_PAGE_SRC = WEB_PAGE_FILES.map(readSrc);

// ─── Homepage SEO metadata ────────────────────────────────────────────────────

describe('homepage SEO metadata', () => {
  it('sets a page title via useHead', () => {
    expect(INDEX_VUE).toContain('useHead');
    expect(INDEX_VUE).toContain('title');
  });

  it('includes a description meta tag', () => {
    expect(INDEX_VUE).toContain("name: 'description'");
    expect(INDEX_VUE).toContain('SITE_DESCRIPTION');
  });

  it('includes og:title and og:description OG tags', () => {
    expect(INDEX_VUE).toContain("'og:title'");
    expect(INDEX_VUE).toContain("'og:description'");
  });

  it('canonical link is driven by siteUrl runtime config, not hardcoded', () => {
    expect(INDEX_VUE).toContain('siteUrl');
    expect(INDEX_VUE).toContain("rel: 'canonical'");
    expect(INDEX_VUE).not.toContain("'qesb.ir'");
    expect(INDEX_VUE).not.toContain('"qesb.ir"');
  });

  it('homepage is indexable — no noindex in page head', () => {
    expect(INDEX_VUE).not.toContain('noindex');
  });
});

// ─── No hardcoded deployment-blocking URLs in pages / components ──────────────
// Note: features/ and composables/ are already covered by the admin-side guardrail.
// This block covers pages/ and components/esports/ which are NOT in that scan.

describe('no hardcoded deployment-blocking URLs in homepage pages and components', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('pages/index.vue does not hardcode a localhost URL as API origin', () => {
    expect(LOCALHOST_URL.test(INDEX_VUE)).toBe(false);
  });

  it('pages/index.vue does not hardcode qesb.ir as a URL', () => {
    expect(QESB_URL.test(INDEX_VUE)).toBe(false);
  });

  it('esports component files do not hardcode localhost URL as API origin', () => {
    for (const src of ESPORTS_COMPONENT_SRC) {
      if (LOCALHOST_URL.test(src)) {
        throw new Error(
          'Hardcoded localhost URL found in an esports component. Use config-driven URLs.',
        );
      }
    }
  });

  it('esports component files do not hardcode qesb.ir as a URL', () => {
    for (const src of ESPORTS_COMPONENT_SRC) {
      if (QESB_URL.test(src)) {
        throw new Error(
          'Hardcoded qesb.ir URL found in an esports component. Use config-driven URLs.',
        );
      }
    }
  });
});

// ─── No unsupported tournament routes linked from homepage ────────────────────

describe('homepage does not link to unsupported Slice 2 tournament routes', () => {
  // [slice-2-precondition] — These routes are legal Phase 1 routes that are simply not yet
  // implemented in Slice 2. When a later tournament slice implements any of them, remove or
  // update the corresponding check below so it no longer blocks the legal route.
  const SLICE2_PRECONDITION_PATTERNS = [
    { label: 'tournament register', pattern: /\/tournaments\/[^'"\s]*\/register/ },
    { label: 'tournament my-registration', pattern: /\/tournaments\/[^'"\s]*\/my-registration/ },
    { label: 'tournament participants', pattern: /\/tournaments\/[^'"\s]*\/participants/ },
    { label: 'tournament results', pattern: /\/tournaments\/[^'"\s]*\/results/ },
    { label: 'tournament standings', pattern: /\/tournaments\/[^'"\s]*\/standings/ },
    { label: 'tournament bracket', pattern: /\/tournaments\/[^'"\s]*\/bracket/ },
  ];

  // [permanent] — /tournaments/:slug/matches/:matchId is permanently forbidden in Phase 1.
  // Do not remove this check in future slices.
  const PERMANENT_FORBIDDEN_PATTERNS = [
    {
      label: 'tournament match detail (matchId) — permanently forbidden in Phase 1',
      pattern: /\/tournaments\/[^'"\s]*\/matches\/\[/,
    },
  ];

  for (const { label, pattern } of SLICE2_PRECONDITION_PATTERNS) {
    it(`[slice-2-precondition] no web page links to not-yet-implemented route: ${label}`, () => {
      for (const src of WEB_PAGE_SRC) {
        if (pattern.test(src)) {
          throw new Error(
            `Tournament route (${label}) found in a web page. Not implemented in Slice 2. ` +
              `If implementing this route in a later slice, remove the [slice-2-precondition] check.`,
          );
        }
      }
    });
  }

  for (const { label, pattern } of PERMANENT_FORBIDDEN_PATTERNS) {
    it(`[permanent] no web page links to permanently forbidden route: ${label}`, () => {
      for (const src of WEB_PAGE_SRC) {
        if (pattern.test(src)) {
          throw new Error(
            `Permanently forbidden route (${label}) found in a web page. This route is forbidden in all Phase 1 slices.`,
          );
        }
      }
    });
  }

  it('EsportsTournamentSection does not link to tournament detail pages', () => {
    const tournamentSection = ESPORTS_COMPONENT_SRC.find((_, i) =>
      ESPORTS_COMPONENT_FILES[i]?.includes('EsportsTournamentSection'),
    );
    if (tournamentSection) {
      expect(tournamentSection).not.toContain('/tournaments/');
    }
  });
});

// ─── SSR-compatible homepage data loading ────────────────────────────────────

describe('homepage SSR pattern', () => {
  it('useEsportsHome composable uses useAsyncData (SSR-compatible)', () => {
    expect(USE_ESPORTS_HOME).toContain('useAsyncData');
  });

  it('homepage does not depend on localStorage for initial render', () => {
    expect(INDEX_VUE).not.toContain('localStorage');
    expect(INDEX_VUE).not.toContain('sessionStorage');
  });

  it('homepage uses the useEsportsHome composable (no direct $fetch)', () => {
    expect(INDEX_VUE).toContain('useEsportsHome');
    expect(INDEX_VUE).not.toContain('$fetch');
    expect(INDEX_VUE).not.toMatch(/(?<!\.)fetch\s*\(/);
  });
});

// ─── No fake content or placeholder sections ──────────────────────────────────

describe('no fake content or placeholder sections in homepage', () => {
  it('homepage does not contain hardcoded fake post slugs', () => {
    const FAKE_SLUG_PATTERN = /['"`](test-news|fake-post|sample-article|lorem-ipsum)['"`]/;
    for (const src of ALL_HOMEPAGE_SRC) {
      if (FAKE_SLUG_PATTERN.test(src)) {
        throw new Error('Hardcoded fake post slug found in homepage. Use real API data only.');
      }
    }
  });

  it('homepage does not contain coming-soon or placeholder text patterns', () => {
    const PLACEHOLDER_PATTERN = /coming[- ]soon|placeholder|lorem ipsum|PLACEHOLDER/i;
    for (const src of ALL_HOMEPAGE_SRC) {
      if (PLACEHOLDER_PATTERN.test(src)) {
        throw new Error('Coming-soon or placeholder text found in homepage source.');
      }
    }
  });

  it('tournament section shows only real data — no hardcoded tournament names', () => {
    const FAKE_TOURNAMENT_PATTERN = /['"`](Dragon Cup 2024|Test Tournament|Fake Tournament)['"`]/;
    for (const src of ALL_HOMEPAGE_SRC) {
      if (FAKE_TOURNAMENT_PATTERN.test(src)) {
        throw new Error('Hardcoded fake tournament name found in homepage source.');
      }
    }
  });
});

// ─── EsportsApi SDK surface (homepage data access) ───────────────────────────

describe('EsportsApi SDK surface for homepage', () => {
  it('createEsportsApi returns a client with getHome method', () => {
    const api = createEsportsApi();
    expect(typeof (api as unknown as Record<string, unknown>)['getHome']).toBe('function');
  });

  it('esports API has no unsupported tournament detail methods', () => {
    const api = createEsportsApi();
    expect('getTournament' in api).toBe(false);
    expect('listTournaments' in api).toBe(false);
    expect('register' in api).toBe(false);
    expect('getParticipants' in api).toBe(false);
    expect('getMatches' in api).toBe(false);
    expect('getResults' in api).toBe(false);
    expect('getStandings' in api).toBe(false);
    expect('getBracket' in api).toBe(false);
  });

  it('esports-api.ts uses createApiClient not native fetch', () => {
    const ESPORTS_API_SRC = readSrc(join(WEB_ROOT, 'features', 'esports', 'esports-api.ts'));
    expect(ESPORTS_API_SRC).toContain('createApiClient');
    expect(ESPORTS_API_SRC).not.toMatch(/(?<!\.)fetch\s*\(/);
  });
});

// ─── No coming-soon / placeholder copy in components ─────────────────────────

describe('no coming-soon placeholder copy in esports components', () => {
  const COMING_SOON_PATTERN = /به زودی|coming[- ]soon|COMING_SOON/i;

  it('EsportsHero has no coming-soon placeholder text', () => {
    const hero = ESPORTS_COMPONENT_SRC.find((_, i) =>
      ESPORTS_COMPONENT_FILES[i]?.includes('EsportsHero'),
    );
    if (hero !== undefined) {
      expect(COMING_SOON_PATTERN.test(hero)).toBe(false);
    }
  });

  it('no esports component contains coming-soon placeholder copy', () => {
    for (const src of ESPORTS_COMPONENT_SRC) {
      if (COMING_SOON_PATTERN.test(src)) {
        throw new Error(
          'Coming-soon placeholder found in esports component. Remove placeholder text.',
        );
      }
    }
  });

  it('index.vue has no coming-soon placeholder text', () => {
    expect(COMING_SOON_PATTERN.test(INDEX_VUE)).toBe(false);
  });
});

// ─── nuxt.config.ts — no localhost defaults ───────────────────────────────────

describe('nuxt.config.ts — no hardcoded localhost runtime defaults', () => {
  it('apiBaseUrl does not default to a localhost URL', () => {
    expect(NUXT_CONFIG_SRC).not.toMatch(/apiBaseUrl.*localhost/);
  });

  it('siteUrl does not default to a localhost URL', () => {
    expect(NUXT_CONFIG_SRC).not.toMatch(/siteUrl.*localhost/);
  });

  it('EsportsHero is guarded with v-if in index.vue (not unconditionally rendered)', () => {
    expect(INDEX_VUE).toMatch(/v-if.*featuredPosts/);
    expect(INDEX_VUE).toContain('EsportsHero');
  });
});
