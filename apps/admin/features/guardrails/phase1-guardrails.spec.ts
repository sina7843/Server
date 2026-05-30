/**
 * Phase 1 static guardrail checks — admin and web source files.
 *
 * These tests prevent Phase 1 drift by scanning source files for:
 *   - no direct fetch() calls (use SDK client wrappers)
 *   - no hardcoded API domains (localhost, qesb.ir)
 *   - no forbidden bracket permission strings
 *   - no unsupported tournament formats
 *   - no forbidden analytics event naming conventions
 *   - no forbidden admin or public routes
 *   - no placeholder/coming-soon pages
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

// ─── File collection helpers ──────────────────────────────────────────────────

function collectFiles(dir: string, exts: string[], excludeSuffixes: string[] = []): string[] {
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
      result.push(...collectFiles(full, exts, excludeSuffixes));
    } else if (exts.includes(extname(entry.name))) {
      if (!excludeSuffixes.some((s) => entry.name.endsWith(s))) {
        result.push(full);
      }
    }
  }
  return result;
}

function readSrc(file: string): string {
  return readFileSync(file, 'utf8');
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const ADMIN_ROOT = join(__dirname, '..', '..');
const WEB_ROOT = join(ADMIN_ROOT, '..', '..', 'web');

// Non-spec source files in admin features + composables
const ADMIN_SRC = [
  ...collectFiles(join(ADMIN_ROOT, 'features'), ['.ts', '.vue'], ['.spec.ts']),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts', '.vue'], ['.spec.ts']),
];

// Non-spec source files in web features + composables
const WEB_SRC = [
  ...collectFiles(join(WEB_ROOT, 'features'), ['.ts', '.vue'], ['.spec.ts']),
  ...collectFiles(join(WEB_ROOT, 'composables'), ['.ts', '.vue'], ['.spec.ts']),
];

const ALL_APP_SRC = [...ADMIN_SRC, ...WEB_SRC];

// ─── No direct fetch() calls ──────────────────────────────────────────────────

describe('no direct fetch() in app source files', () => {
  // Matches standalone `fetch(` not preceded by a dot (which would be .fetch() on an object)
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('admin feature/composable files do not call fetch() directly', () => {
    for (const file of ADMIN_SRC) {
      const src = readSrc(file);
      if (DIRECT_FETCH.test(src)) {
        fail(`Direct fetch() found in ${file}. Use SDK client wrappers instead.`);
      }
    }
  });

  it('web feature/composable files do not call fetch() directly', () => {
    for (const file of WEB_SRC) {
      const src = readSrc(file);
      if (DIRECT_FETCH.test(src)) {
        fail(`Direct fetch() found in ${file}. Use SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No hardcoded API domains ─────────────────────────────────────────────────

describe('no hardcoded API domains in app source files', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('admin files do not hardcode localhost as an API origin', () => {
    for (const file of ADMIN_SRC) {
      const src = readSrc(file);
      if (LOCALHOST_URL.test(src)) {
        fail(
          `Hardcoded localhost URL found in ${file}. Use SDK baseUrl from runtime configuration.`,
        );
      }
    }
  });

  it('web files do not hardcode localhost as an API origin', () => {
    for (const file of WEB_SRC) {
      const src = readSrc(file);
      if (LOCALHOST_URL.test(src)) {
        fail(
          `Hardcoded localhost URL found in ${file}. Use SDK baseUrl from runtime configuration.`,
        );
      }
    }
  });

  it('admin files do not hardcode qesb.ir as an API origin', () => {
    for (const file of ADMIN_SRC) {
      const src = readSrc(file);
      if (QESB_URL.test(src)) {
        fail(`Hardcoded qesb.ir URL found in ${file}. Use SDK baseUrl from runtime configuration.`);
      }
    }
  });

  it('web files do not hardcode qesb.ir as an API origin', () => {
    for (const file of WEB_SRC) {
      const src = readSrc(file);
      if (QESB_URL.test(src)) {
        fail(`Hardcoded qesb.ir URL found in ${file}. Use SDK baseUrl from runtime configuration.`);
      }
    }
  });
});

// ─── No raw permission strings ────────────────────────────────────────────────

describe('no raw Phase 1 permission strings in app source files', () => {
  const FORBIDDEN_BRACKET_PERMS = [
    "'tournament.bracket.read'",
    '"tournament.bracket.read"',
    "'tournament.bracket.manage'",
    '"tournament.bracket.manage"',
  ];

  it('no source file uses raw tournament.bracket.read permission string', () => {
    for (const file of ALL_APP_SRC) {
      const src = readSrc(file);
      for (const perm of FORBIDDEN_BRACKET_PERMS.slice(0, 2)) {
        if (src.includes(perm)) {
          fail(
            `Raw permission ${perm} found in ${file}. Use DragonPermissions.TOURNAMENT_MATCH_READ (bracket access uses match.read).`,
          );
        }
      }
    }
  });

  it('no source file uses raw tournament.bracket.manage permission string', () => {
    for (const file of ALL_APP_SRC) {
      const src = readSrc(file);
      for (const perm of FORBIDDEN_BRACKET_PERMS.slice(2)) {
        if (src.includes(perm)) {
          fail(
            `Raw permission ${perm} found in ${file}. Bracket manage is a forbidden Phase 1 permission.`,
          );
        }
      }
    }
  });
});

// ─── No unsupported tournament formats ───────────────────────────────────────

describe('no unsupported tournament format strings in app source files', () => {
  const UNSUPPORTED_FORMATS = [
    { format: 'swiss', pattern: /['"`]swiss['"`]/ },
    { format: 'double_elimination', pattern: /['"`]double_elimination['"`]/ },
    { format: 'advanced_bracket_editor', pattern: /['"`]advanced_bracket_editor['"`]/ },
  ];

  for (const { format, pattern } of UNSUPPORTED_FORMATS) {
    it(`no app source file references unsupported format '${format}'`, () => {
      for (const file of ALL_APP_SRC) {
        const src = readSrc(file);
        if (pattern.test(src)) {
          fail(
            `Unsupported format '${format}' found in ${file}. Phase 1 supports only: single_elimination, round_robin, manual.`,
          );
        }
      }
    });
  }
});

// ─── No forbidden analytics event naming conventions ─────────────────────────

describe('no forbidden analytics event naming conventions in app source files', () => {
  // Phase 1 events use dot notation (tournament.viewed), not snake_case (tournament_viewed)
  const FORBIDDEN_NAMING = [
    { name: 'tournament_viewed', pattern: /['"`]tournament_viewed['"`]/ },
    { name: 'registrationStarted', pattern: /['"`]tournament\.registrationStarted['"`]/ },
    { name: 'registration_completed (snake_case)', pattern: /['"`]registration_completed['"`]/ },
    { name: 'bracket_viewed (no namespace)', pattern: /['"`]bracket_viewed['"`]/ },
    { name: 'matchViewed (camelCase)', pattern: /['"`]matchViewed['"`]/ },
  ];

  for (const { name, pattern } of FORBIDDEN_NAMING) {
    it(`no app source file uses forbidden analytics event '${name}'`, () => {
      for (const file of ALL_APP_SRC) {
        const src = readSrc(file);
        if (pattern.test(src)) {
          fail(
            `Forbidden analytics event naming '${name}' found in ${file}. Use dot-namespaced events like 'tournament.viewed'.`,
          );
        }
      }
    });
  }
});

// ─── No forbidden admin routes ────────────────────────────────────────────────

describe('no forbidden admin routes defined', () => {
  const ADMIN_PAGES = collectFiles(join(ADMIN_ROOT, 'pages'), ['.vue', '.ts']);

  it('no admin page exists for /tournaments/:id/operations route', () => {
    const hasOperationsPage = ADMIN_PAGES.some(
      (f) => f.includes('tournaments') && f.includes('operations'),
    );
    expect(hasOperationsPage).toBe(false);
  });

  it('no admin page exists for /tournaments/:id/preview route', () => {
    const hasTournamentPreview = ADMIN_PAGES.some(
      (f) => f.includes('tournaments') && f.includes('preview'),
    );
    expect(hasTournamentPreview).toBe(false);
  });

  it('no admin tournament pages exist at all (reserved for later slices)', () => {
    const hasTournamentPage = ADMIN_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/tournaments/');
    });
    expect(hasTournamentPage).toBe(false);
  });

  it('no admin games pages exist (reserved for later slices)', () => {
    const hasGamesPage = ADMIN_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/games/');
    });
    expect(hasGamesPage).toBe(false);
  });
});

// ─── No forbidden public routes ───────────────────────────────────────────────

describe('no forbidden public routes defined', () => {
  const WEB_PAGES = collectFiles(join(WEB_ROOT, 'pages'), ['.vue', '.ts']);

  it('no public page exists for /tournaments/:slug/matches/:matchId route', () => {
    const hasMatchDetailPage = WEB_PAGES.some(
      (f) => f.includes('tournaments') && f.includes('matches'),
    );
    expect(hasMatchDetailPage).toBe(false);
  });

  it('no public tournament pages exist at all (reserved for later slices)', () => {
    const hasTournamentPage = WEB_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/tournaments/');
    });
    expect(hasTournamentPage).toBe(false);
  });

  it('no public games pages exist (reserved for later slices)', () => {
    const hasGamesPage = WEB_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/games/');
    });
    expect(hasGamesPage).toBe(false);
  });
});

// ─── No placeholder or coming-soon pages ─────────────────────────────────────

describe('no placeholder or coming-soon pages in apps', () => {
  const PLACEHOLDER_PATHS = [
    join(ADMIN_ROOT, 'pages', 'coming-soon.vue'),
    join(ADMIN_ROOT, 'pages', 'placeholder.vue'),
    join(WEB_ROOT, 'pages', 'coming-soon.vue'),
    join(WEB_ROOT, 'pages', 'placeholder.vue'),
  ];

  it('no coming-soon.vue page exists in admin or web', () => {
    for (const p of PLACEHOLDER_PATHS.filter((f) => f.includes('coming-soon'))) {
      const exists = (() => {
        try {
          readFileSync(p);
          return true;
        } catch {
          return false;
        }
      })();
      expect(exists).toBe(false);
    }
  });

  it('no placeholder.vue page exists in admin or web', () => {
    for (const p of PLACEHOLDER_PATHS.filter((f) => f.includes('placeholder'))) {
      const exists = (() => {
        try {
          readFileSync(p);
          return true;
        } catch {
          return false;
        }
      })();
      expect(exists).toBe(false);
    }
  });

  it('admin page files do not contain coming-soon template patterns', () => {
    const ADMIN_PAGES = collectFiles(join(ADMIN_ROOT, 'pages'), ['.vue']);
    const COMING_SOON_MARKERS = ['coming-soon', 'Coming Soon', 'coming_soon', 'comingSoon'];
    for (const file of ADMIN_PAGES) {
      const src = readSrc(file);
      for (const marker of COMING_SOON_MARKERS) {
        if (src.includes(marker)) {
          fail(`Coming-soon marker '${marker}' found in admin page ${file}.`);
        }
      }
    }
  });
});
