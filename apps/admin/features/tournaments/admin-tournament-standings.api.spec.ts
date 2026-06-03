/**
 * Admin tournament standings feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - /tournaments/:id/standings route exists without /admin prefix
 *   - No direct fetch() in standings feature/composable/page files
 *   - No public SDK used for admin standings workflows
 *   - No fake standings data in source files
 *   - No hardcoded localhost/qesb.ir in standings source files
 *   - Permission constants used (no raw permission strings)
 *   - No live-scoring/WebSocket/bracket editor UI in standings pages
 *   - No /admin prefix in route file paths
 *   - No /tournaments/:id/operations or /tournaments/:id/preview routes
 *   - No client-only standings recalculation
 *   - Standings read uses TOURNAMENT_MATCH_READ permission
 *   - Standings recalculate uses TOURNAMENT_RESULT_MANAGE permission
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createAdminTournamentStandingsClient, createApiClient, ApiClientError } from '@dragon/sdk';

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TOURNAMENT_ID = '507f1f77bcf86cd799439011';

const mockStandingsEntry = {
  rank: 1,
  participantId: '507f1f77bcf86cd799439066',
  displayName: 'Team Alpha',
  wins: 3,
  losses: 0,
  points: 9,
};

const mockStandings = {
  tournamentId: TOURNAMENT_ID,
  format: 'single_elimination',
  standings: [mockStandingsEntry],
  updatedAt: '2026-06-01T12:00:00.000Z',
};

const mockRecalcResult = {
  success: true,
  tournamentId: TOURNAMENT_ID,
  recalculatedAt: '2026-06-01T12:30:00.000Z',
};

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentStandingsClient — SDK delegation', () => {
  describe('get', () => {
    it('calls GET /admin/v1/tournaments/:id/standings', async () => {
      mockJson(mockStandings);
      const result = await createAdminTournamentStandingsClient(client).get(TOURNAMENT_ID);
      expect(result.tournamentId).toBe(TOURNAMENT_ID);
      expect(result.standings).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/standings`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentStandingsClient(client).get('bad-id'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(
        createAdminTournamentStandingsClient(client).get(TOURNAMENT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('recalculate', () => {
    it('calls POST /admin/v1/tournaments/:id/standings/recalculate', async () => {
      mockJson(mockRecalcResult);
      const result = await createAdminTournamentStandingsClient(client).recalculate(TOURNAMENT_ID);
      expect(result.success).toBe(true);
      expect(result.tournamentId).toBe(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/standings/recalculate`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(
        createAdminTournamentStandingsClient(client).recalculate(TOURNAMENT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });

    it('throws ApiClientError on 422', async () => {
      mockJson({ message: 'Unprocessable' }, 422);
      await expect(
        createAdminTournamentStandingsClient(client).recalculate(TOURNAMENT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentStandingsClient surface', () => {
  const standingsClient = createAdminTournamentStandingsClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: get, recalculate', () => {
    expect(typeof standingsClient.get).toBe('function');
    expect(typeof standingsClient.recalculate).toBe('function');
  });

  it('has no list method', () => {
    expect('list' in standingsClient).toBe(false);
  });

  it('has no create method', () => {
    expect('create' in standingsClient).toBe(false);
  });

  it('has no update method', () => {
    expect('update' in standingsClient).toBe(false);
  });

  it('has no delete method', () => {
    expect('delete' in standingsClient).toBe(false);
  });
});

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

const ADMIN_ROOT = join(__dirname, '..', '..');

const STANDINGS_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('standing')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Standing'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('standings'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin standings routes — file existence', () => {
  it('/tournaments/:id/standings route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/standings.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/standings/index.vue'),
    );
    expect(exists).toBe(true);
  });

  it('no tournament page file has /admin prefix in its route path', () => {
    for (const file of ALL_TOURNAMENT_PAGES) {
      const normalized = file.replace(/\\/g, '/');
      expect(normalized).not.toMatch(/\/pages\/admin\/tournaments\//);
    }
  });

  it('no standalone /tournaments/:id/operations page exists', () => {
    const hasOps = ALL_TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/operations'),
    );
    expect(hasOps).toBe(false);
  });

  it('no standalone /tournaments/:id/preview page exists', () => {
    const hasPreview = ALL_TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/preview'),
    );
    expect(hasPreview).toBe(false);
  });
});

// ─── No direct fetch in standings source files ────────────────────────────────

describe('standings source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('standings source files do not call fetch() directly', () => {
    for (const file of STANDINGS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios ───────────────────────────────────────────────────────

describe('standings source files — no $fetch or axios', () => {
  it('standings pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('standings pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake standings data ───────────────────────────────────────────────────

describe('standings source files — no fake standings data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Standings', pattern: /Fake\s+Standings/i },
    { label: 'mockStandings assignment', pattern: /\bmockStandings\s*=\s*\{/ },
    { label: 'fakeStandings assignment', pattern: /\bfakeStandings\s*=\s*\{/ },
  ];

  it('standings source files do not contain fake/mock standings data', () => {
    for (const file of STANDINGS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake standings data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('standings source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('standings source files do not hardcode localhost as API origin', () => {
    for (const file of STANDINGS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('standings source files do not hardcode qesb.ir as API origin', () => {
    for (const file of STANDINGS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ────────────────────────────────────────────────────

describe('standings pages — centralized permissions only', () => {
  it('standings pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.match\.read'/);
      expect(src).not.toMatch(/"tournament\.match\.read"/);
      expect(src).not.toMatch(/'tournament\.result\.manage'/);
      expect(src).not.toMatch(/"tournament\.result\.manage"/);
    }
  });

  it('standings pages use TOURNAMENT_MATCH_READ for standings read access', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_MATCH_READ/);
    }
  });

  it('standings pages use TOURNAMENT_RESULT_MANAGE for recalculate access', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_RESULT_MANAGE/);
    }
  });
});

// ─── Scope guardrails ────────────────────────────────────────────────────────

describe('standings pages — scope guardrails', () => {
  it('standings pages do not contain bracket editor UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
      expect(src).not.toMatch(/drag.*drop/i);
    }
  });

  it('standings pages do not contain live scoring or WebSocket', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/LiveScoring/i);
      expect(src).not.toMatch(/WebSocket/i);
      expect(src).not.toMatch(/useWebSocket/i);
    }
  });

  it('standings pages do not compute standings locally as source of truth', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/computeStandings/i);
      expect(src).not.toMatch(/calculatePoints/i);
      expect(src).not.toMatch(/sortByPoints.*\.map/i);
    }
  });

  it('standings pages use useAdminTournamentStandings composable', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentStandings/);
    }
  });

  it('standings pages do not use public SDK for admin mutation', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });
});
