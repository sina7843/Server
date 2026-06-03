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

import { readFileSync, readdirSync, existsSync } from 'fs';
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

  it('admin tournament pages exist (Task 5.2)', () => {
    const hasTournamentPage = ADMIN_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/tournaments/');
    });
    expect(hasTournamentPage).toBe(true);
  });

  it('admin games pages exist (Task 3.2)', () => {
    const hasGamesPage = ADMIN_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('/pages/games/');
    });
    expect(hasGamesPage).toBe(true);
  });
});

// ─── No forbidden public routes ───────────────────────────────────────────────

describe('no forbidden public routes defined', () => {
  const WEB_PAGES = collectFiles(join(WEB_ROOT, 'pages'), ['.vue', '.ts']);

  // PERMANENTLY forbidden: public match DETAIL route is never allowed in Phase 1.
  // NOTE: /tournaments/:slug/matches (list) IS legal in a future slice — do not block it.
  // In Nuxt file routing, the match detail page appears as matches/[matchId].vue
  // (a dynamic segment inside a matches/ folder). The matches list page appears as
  // matches.vue or matches/index.vue and does NOT have a dynamic segment after /matches/.
  it('no public page exists for /tournaments/:slug/matches/:matchId (match detail — permanently forbidden)', () => {
    const hasMatchDetailPage = WEB_PAGES.some((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('tournaments') && /\/matches\/\[/.test(normalized);
    });
    expect(hasMatchDetailPage).toBe(false);
  });

  // PERMANENTLY forbidden: public /games and /games/:slug pages are never allowed in Phase 1.
  // The games list/detail flow is admin-only. Do not remove this check in future slices.
  it('[permanent] no public games pages exist (public games route is forbidden in Phase 1)', () => {
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

// ─── Slice 10: all operation sub-routes now exist ────────────────────────────

describe('[slice-10] all operation sub-routes exist', () => {
  const ADMIN_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

  it('/tournaments/:id/registrations route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/registrations'));
    expect(has).toBe(true);
  });

  it('/tournaments/:id/participants route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/participants'));
    expect(has).toBe(true);
  });

  it('/tournaments/:id/matches route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/matches'));
    expect(has).toBe(true);
  });

  it('/tournaments/:id/results route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/results'));
    expect(has).toBe(true);
  });

  it('/tournaments/:id/standings route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/standings'));
    expect(has).toBe(true);
  });

  it('/tournaments/:id/bracket route exists (Slice 10)', () => {
    const has = ADMIN_PAGES.some((f) => f.replace(/\\/g, '/').includes('/bracket'));
    expect(has).toBe(true);
  });
});

// ─── Slice 5: admin tournament UI — lifecycle uses explicit SDK methods ───────

describe('Slice 5 — admin tournament lifecycle uses explicit SDK methods', () => {
  it('TournamentLifecycleActionButtons does not call generic update for any action', () => {
    const src = readSrc(
      join(ADMIN_ROOT, 'components', 'tournaments', 'TournamentLifecycleActionButtons.vue'),
    );
    expect(src).not.toMatch(/updateTournament|\.update\s*\(/);
  });

  it('TournamentOperationalHub emits lifecycleAction events (not generic update)', () => {
    const src = readSrc(
      join(ADMIN_ROOT, 'components', 'tournaments', 'TournamentOperationalHub.vue'),
    );
    expect(src).toContain("emit('lifecycleAction'");
    expect(src).not.toMatch(/updateTournament|\.update\s*\(/);
  });

  it('TournamentForm does not expose status field', () => {
    const src = readSrc(join(ADMIN_ROOT, 'components', 'tournaments', 'TournamentForm.vue'));
    expect(src).not.toMatch(/v-model="form\.status"/);
    expect(src).not.toMatch(/name="status"/);
  });

  it('TournamentForm does not expose publishedAt/cancelledAt/archivedAt/deletedAt fields', () => {
    const src = readSrc(join(ADMIN_ROOT, 'components', 'tournaments', 'TournamentForm.vue'));
    expect(src).not.toContain('publishedAt');
    expect(src).not.toContain('cancelledAt');
    expect(src).not.toContain('archivedAt');
    expect(src).not.toContain('deletedAt');
  });

  it('edit page uses updateTournament (not lifecycle transitions) for non-lifecycle fields', () => {
    const src = readSrc(join(ADMIN_ROOT, 'pages', 'tournaments', '[id]', 'edit.vue'));
    expect(src).toContain('updateTournament');
    expect(src).not.toMatch(/publishTournament|cancelTournament|archiveTournament/);
  });

  it('detail page dispatches lifecycle actions via TournamentOperationalHub (not direct updates)', () => {
    const src = readSrc(join(ADMIN_ROOT, 'pages', 'tournaments', '[id]', 'index.vue'));
    expect(src).toContain('TournamentOperationalHub');
    expect(src).toContain('@lifecycle-action');
  });
});

// ─── Slice 5: admin tournament UI — no fake data in components/pages ──────────

describe('Slice 5 — no fake tournament data in admin tournament components and pages', () => {
  const TOURNAMENT_UI_FILES = [
    ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']),
    ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']),
  ];

  const FAKE_PATTERNS = [
    { label: 'Dragon Cup', pattern: /Dragon Cup/i },
    { label: 'fake tournament', pattern: /fake\s+tournament/i },
    { label: 'mockTournament literal', pattern: /\bmockTournament\s*=\s*\{/ },
    { label: 'hardcoded tournament id', pattern: /507f1f77bcf86cd799439/ },
  ];

  it('no fake or mock tournament data in tournament UI source files', () => {
    for (const file of TOURNAMENT_UI_FILES) {
      const src = readSrc(file);
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(
            `Fake tournament data pattern '${label}' found in ${file}. Use real SDK data only.`,
          );
        }
      }
    }
  });
});

// ─── Slice 5: docs verification ──────────────────────────────────────────────

describe('Slice 5 — docs exist', () => {
  const docsPath = join(
    ADMIN_ROOT,
    '..',
    '..',
    'docs',
    'development',
    'phase-1-slice-5-verification.md',
  );

  it('phase-1-slice-5-verification.md exists in docs/development', () => {
    expect(existsSync(docsPath)).toBe(true);
  });

  it('phase-1-slice-5-verification.md mentions lifecycle bypass prevention', () => {
    if (!existsSync(docsPath)) return;
    const src = readSrc(docsPath);
    expect(src).toMatch(/lifecycle.*bypass|bypass.*lifecycle/i);
  });

  it('phase-1-slice-5-verification.md mentions PATCH restrictions', () => {
    if (!existsSync(docsPath)) return;
    const src = readSrc(docsPath);
    expect(src).toMatch(/PATCH/);
  });
});
