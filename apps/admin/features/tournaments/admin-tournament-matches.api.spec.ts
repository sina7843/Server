/**
 * Admin tournament matches feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - /tournaments/:id/matches route exists without /admin prefix
 *   - No direct fetch() in matches feature/composable/page files
 *   - No public SDK used for admin match workflows
 *   - No fake match data in source files
 *   - No hardcoded localhost/qesb.ir in matches source files
 *   - Permission constants used (no raw permission strings)
 *   - No bracket/standings/live-scoring UI in matches pages
 *   - No /admin prefix in route file paths
 *   - No /tournaments/:id/operations or /tournaments/:id/preview routes
 *   - No frontend match generation algorithm
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createAdminTournamentMatchesClient, createApiClient, ApiClientError } from '@dragon/sdk';

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

const mockMatch = {
  id: MATCH_ID,
  tournamentId: TOURNAMENT_ID,
  round: 1,
  matchNumber: 1,
  status: 'scheduled',
  participant1Id: '507f1f77bcf86cd799439066',
  participant2Id: '507f1f77bcf86cd799439077',
};

const mockList = { items: [mockMatch], total: 1, page: 1, limit: 100 };

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentMatchesClient — SDK delegation', () => {
  describe('list', () => {
    it('calls GET /admin/v1/tournaments/:id/matches', async () => {
      mockJson(mockList);
      const result = await createAdminTournamentMatchesClient(client).list(TOURNAMENT_ID);
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends round query param', async () => {
      mockJson(mockList);
      await createAdminTournamentMatchesClient(client).list(TOURNAMENT_ID, { round: 2 });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('round=2');
    });

    it('appends status query param', async () => {
      mockJson(mockList);
      await createAdminTournamentMatchesClient(client).list(TOURNAMENT_ID, {
        status: 'scheduled',
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('status=scheduled');
    });

    it('appends page and limit query params', async () => {
      mockJson(mockList);
      await createAdminTournamentMatchesClient(client).list(TOURNAMENT_ID, {
        page: 1,
        limit: 100,
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=100');
    });
  });

  describe('create', () => {
    it('calls POST /admin/v1/tournaments/:id/matches', async () => {
      mockJson(mockMatch);
      const result = await createAdminTournamentMatchesClient(client).create(TOURNAMENT_ID, {
        round: 1,
        matchNumber: 1,
      });
      expect(result.id).toBe(MATCH_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes round and matchNumber in request body', async () => {
      mockJson(mockMatch);
      await createAdminTournamentMatchesClient(client).create(TOURNAMENT_ID, {
        round: 3,
        matchNumber: 5,
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.round).toBe(3);
      expect(body.matchNumber).toBe(5);
    });

    it('throws ApiClientError on 400', async () => {
      mockJson({ message: 'Bad request' }, 400);
      await expect(
        createAdminTournamentMatchesClient(client).create(TOURNAMENT_ID, {
          round: 1,
          matchNumber: 1,
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('generate', () => {
    it('calls POST /admin/v1/tournaments/:id/matches/generate', async () => {
      mockJson(mockList);
      const result = await createAdminTournamentMatchesClient(client).generate(TOURNAMENT_ID);
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/generate`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 409', async () => {
      mockJson({ message: 'Conflict' }, 409);
      await expect(
        createAdminTournamentMatchesClient(client).generate(TOURNAMENT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('update', () => {
    it('calls PATCH /admin/v1/tournaments/:id/matches/:matchId', async () => {
      mockJson({ ...mockMatch, notes: 'updated' });
      await createAdminTournamentMatchesClient(client).update(TOURNAMENT_ID, MATCH_ID, {
        notes: 'updated',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/${MATCH_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('includes fields in request body', async () => {
      mockJson(mockMatch);
      await createAdminTournamentMatchesClient(client).update(TOURNAMENT_ID, MATCH_ID, {
        notes: 'test note',
        scheduledAt: '2026-06-01T10:00:00.000Z',
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.notes).toBe('test note');
      expect(body.scheduledAt).toBe('2026-06-01T10:00:00.000Z');
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentMatchesClient(client).update(TOURNAMENT_ID, 'bad-id', {}),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('cancel', () => {
    it('calls POST /admin/v1/tournaments/:id/matches/:matchId/cancel', async () => {
      mockJson({ ...mockMatch, status: 'cancelled' });
      await createAdminTournamentMatchesClient(client).cancel(TOURNAMENT_ID, MATCH_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/matches/${MATCH_ID}/cancel`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(
        createAdminTournamentMatchesClient(client).cancel(TOURNAMENT_ID, MATCH_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentMatchesClient surface', () => {
  const matchClient = createAdminTournamentMatchesClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: list, create, generate, update, cancel', () => {
    expect(typeof matchClient.list).toBe('function');
    expect(typeof matchClient.create).toBe('function');
    expect(typeof matchClient.generate).toBe('function');
    expect(typeof matchClient.update).toBe('function');
    expect(typeof matchClient.cancel).toBe('function');
  });

  it('has no delete method (use cancel instead)', () => {
    expect('delete' in matchClient).toBe(false);
  });

  it('has no get method (matches loaded via list)', () => {
    expect('get' in matchClient).toBe(false);
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

const MATCHES_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('match')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Match'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']).filter(
    (f) => f.includes('Match') || f.includes('match'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('matches'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin matches routes — file existence', () => {
  it('/tournaments/:id/matches route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/matches.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/matches/index.vue'),
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

// ─── No direct fetch in matches source files ──────────────────────────────────

describe('matches source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('matches source files do not call fetch() directly', () => {
    for (const file of MATCHES_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios in matches pages ──────────────────────────────────────

describe('matches source files — no $fetch or axios', () => {
  it('matches pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('matches pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake match data ───────────────────────────────────────────────────────

describe('matches source files — no fake match data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Match', pattern: /Fake\s+Match/i },
    { label: 'mockMatch assignment', pattern: /\bmockMatch\s*=\s*\{/ },
    { label: 'fakeMatch assignment', pattern: /\bfakeMatch\s*=\s*\{/ },
  ];

  it('matches source files do not contain fake/mock match data', () => {
    for (const file of MATCHES_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake match data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('matches source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('matches source files do not hardcode localhost as API origin', () => {
    for (const file of MATCHES_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('matches source files do not hardcode qesb.ir as API origin', () => {
    for (const file of MATCHES_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ────────────────────────────────────────────────────

describe('matches pages — centralized permissions only', () => {
  it('matches pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.match\.(read|manage)'/);
      expect(src).not.toMatch(/"tournament\.match\.(read|manage)"/);
    }
  });
});

// ─── Scope guardrails ────────────────────────────────────────────────────────

describe('matches pages — scope guardrails', () => {
  it('matches pages do not contain bracket UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
      expect(src).not.toMatch(/bracket/i);
    }
  });

  it('matches pages do not contain standings or live-scoring UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/StandingsTable/i);
      expect(src).not.toMatch(/LiveScoring/i);
    }
  });

  it('matches pages do not use public SDK for admin mutation', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });

  it('matches pages do not contain a frontend match generation algorithm', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/swiss.*pairing/i);
      expect(src).not.toMatch(/double.*elimination/i);
      expect(src).not.toMatch(/bye.*round/i);
    }
  });
});
