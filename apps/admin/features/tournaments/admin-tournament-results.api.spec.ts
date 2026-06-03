/**
 * Admin tournament results feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - /tournaments/:id/results route exists without /admin prefix
 *   - No direct fetch() in results feature/composable/page files
 *   - No public SDK used for admin result workflows
 *   - No fake result data in source files
 *   - No hardcoded localhost/qesb.ir in results source files
 *   - Permission constants used (no raw permission strings)
 *   - No standings/bracket/live-scoring/ResultEntry/StandingsTable UI in results pages
 *   - No /admin prefix in route file paths
 *   - No /tournaments/:id/operations or /tournaments/:id/preview routes
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createAdminTournamentResultsClient, createApiClient, ApiClientError } from '@dragon/sdk';

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
const MATCH_ID = '507f1f77bcf86cd799439055';
const WINNER_ID = '507f1f77bcf86cd799439066';

const mockResult = {
  matchId: MATCH_ID,
  tournamentId: TOURNAMENT_ID,
  winnerId: WINNER_ID,
  participant1Score: 3,
  participant2Score: 1,
  recordedAt: '2026-06-01T12:00:00.000Z',
};

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentResultsClient — SDK delegation', () => {
  describe('record', () => {
    it('calls POST /admin/v1/tournaments/:id/matches/:matchId/result', async () => {
      mockJson(mockResult);
      const result = await createAdminTournamentResultsClient(client).record(
        TOURNAMENT_ID,
        MATCH_ID,
        { winnerId: WINNER_ID },
      );
      expect(result.winnerId).toBe(WINNER_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/${MATCH_ID}/result`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes winnerId in request body', async () => {
      mockJson(mockResult);
      await createAdminTournamentResultsClient(client).record(TOURNAMENT_ID, MATCH_ID, {
        winnerId: WINNER_ID,
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.winnerId).toBe(WINNER_ID);
    });

    it('includes scores in request body when provided', async () => {
      mockJson(mockResult);
      await createAdminTournamentResultsClient(client).record(TOURNAMENT_ID, MATCH_ID, {
        winnerId: WINNER_ID,
        participant1Score: 3,
        participant2Score: 1,
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.participant1Score).toBe(3);
      expect(body.participant2Score).toBe(1);
    });

    it('includes notes in request body when provided', async () => {
      mockJson(mockResult);
      await createAdminTournamentResultsClient(client).record(TOURNAMENT_ID, MATCH_ID, {
        winnerId: WINNER_ID,
        notes: 'match notes',
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.notes).toBe('match notes');
    });

    it('throws ApiClientError on 409 (result already exists)', async () => {
      mockJson({ message: 'Conflict' }, 409);
      await expect(
        createAdminTournamentResultsClient(client).record(TOURNAMENT_ID, MATCH_ID, {
          winnerId: WINNER_ID,
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });

    it('throws ApiClientError on 422 (invalid winner)', async () => {
      mockJson({ message: 'Unprocessable' }, 422);
      await expect(
        createAdminTournamentResultsClient(client).record(TOURNAMENT_ID, MATCH_ID, {
          winnerId: 'not-a-participant',
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('update', () => {
    it('calls PATCH /admin/v1/tournaments/:id/matches/:matchId/result', async () => {
      mockJson({ ...mockResult, participant1Score: 2 });
      await createAdminTournamentResultsClient(client).update(TOURNAMENT_ID, MATCH_ID, {
        winnerId: WINNER_ID,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/${MATCH_ID}/result`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('includes winnerId and scores in request body', async () => {
      mockJson(mockResult);
      await createAdminTournamentResultsClient(client).update(TOURNAMENT_ID, MATCH_ID, {
        winnerId: WINNER_ID,
        participant1Score: 2,
        participant2Score: 0,
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.winnerId).toBe(WINNER_ID);
      expect(body.participant1Score).toBe(2);
      expect(body.participant2Score).toBe(0);
    });

    it('throws ApiClientError on 404 (no result to update)', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentResultsClient(client).update(TOURNAMENT_ID, MATCH_ID, {
          winnerId: WINNER_ID,
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('void', () => {
    it('calls POST /admin/v1/tournaments/:id/matches/:matchId/result/void', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => null });
      await createAdminTournamentResultsClient(client).void(TOURNAMENT_ID, MATCH_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/${MATCH_ID}/result/void`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentResultsClient(client).void(TOURNAMENT_ID, 'bad-id'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentResultsClient surface', () => {
  const resultsClient = createAdminTournamentResultsClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: record, update, void', () => {
    expect(typeof resultsClient.record).toBe('function');
    expect(typeof resultsClient.update).toBe('function');
    expect(typeof resultsClient.void).toBe('function');
  });

  it('has no list method (results are embedded in match DTOs)', () => {
    expect('list' in resultsClient).toBe(false);
  });

  it('has no get method (results accessed via match data)', () => {
    expect('get' in resultsClient).toBe(false);
  });

  it('has no delete method (use void instead)', () => {
    expect('delete' in resultsClient).toBe(false);
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

const RESULTS_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('result')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Result'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('results'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin results routes — file existence', () => {
  it('/tournaments/:id/results route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/results.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/results/index.vue'),
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

// ─── No direct fetch in results source files ──────────────────────────────────

describe('results source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('results source files do not call fetch() directly', () => {
    for (const file of RESULTS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios in results pages ──────────────────────────────────────

describe('results source files — no $fetch or axios', () => {
  it('results pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('results pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake result data ──────────────────────────────────────────────────────

describe('results source files — no fake result data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Result', pattern: /Fake\s+Result/i },
    { label: 'mockResult assignment', pattern: /\bmockResult\s*=\s*\{/ },
    { label: 'fakeResult assignment', pattern: /\bfakeResult\s*=\s*\{/ },
  ];

  it('results source files do not contain fake/mock result data', () => {
    for (const file of RESULTS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake result data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('results source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('results source files do not hardcode localhost as API origin', () => {
    for (const file of RESULTS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('results source files do not hardcode qesb.ir as API origin', () => {
    for (const file of RESULTS_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ────────────────────────────────────────────────────

describe('results pages — centralized permissions only', () => {
  it('results pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.(match\.read|result\.manage)'/);
      expect(src).not.toMatch(/"tournament\.(match\.read|result\.manage)"/);
    }
  });
});

// ─── Scope guardrails ────────────────────────────────────────────────────────

describe('results pages — scope guardrails', () => {
  it('results pages do not contain bracket UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
    }
  });

  it('results pages do not contain StandingsTable component', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/StandingsTable/);
    }
  });

  it('results pages do not use ResultEntry as a component name', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/<ResultEntry/);
      expect(src).not.toMatch(/ResultEntry\s*>/);
    }
  });

  it('results pages do not use public SDK for admin mutation', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });

  it('results pages use useAdminTournamentMatches for data loading', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentMatches/);
    }
  });

  it('results pages use useAdminTournamentResults for mutations', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentResults/);
    }
  });
});
