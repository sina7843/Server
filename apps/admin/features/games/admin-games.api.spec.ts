/**
 * Admin games feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - Admin games routes exist without /admin prefix
 *   - No direct fetch() in the games feature/composable files
 *   - No fake game data in games files
 *   - SDK surface did not expand beyond locked game methods
 *   - No hardcoded localhost/qesb.ir in games files
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { ApiClientError, createAdminGamesClient, createApiClient } from '@dragon/sdk';

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

const GAME_ID = '507f1f77bcf86cd799439011';

const mockGame = {
  id: GAME_ID,
  name: 'Counter-Strike 2',
  slug: 'counter-strike-2',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockList = { items: [mockGame], total: 1, page: 1, limit: 20 };

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminGamesClient — SDK delegation', () => {
  describe('list', () => {
    it('calls GET /admin/v1/games without params', async () => {
      mockJson(mockList);
      const result = await createAdminGamesClient(client).list();
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/v1/games',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends status query param when provided', async () => {
      mockJson(mockList);
      await createAdminGamesClient(client).list({ status: 'active' });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('status=active');
    });

    it('appends page and limit query params', async () => {
      mockJson(mockList);
      await createAdminGamesClient(client).list({ page: 2, limit: 10 });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  describe('get', () => {
    it('calls GET /admin/v1/games/:id', async () => {
      mockJson(mockGame);
      const result = await createAdminGamesClient(client).get(GAME_ID);
      expect(result.id).toBe(GAME_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/games/${GAME_ID}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(createAdminGamesClient(client).get('bad-id')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('create', () => {
    it('calls POST /admin/v1/games with JSON body', async () => {
      mockJson(mockGame);
      await createAdminGamesClient(client).create({
        name: 'Counter-Strike 2',
        slug: 'counter-strike-2',
        status: 'active',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/v1/games',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('update', () => {
    it('calls PATCH /admin/v1/games/:id', async () => {
      mockJson(mockGame);
      await createAdminGamesClient(client).update(GAME_ID, { name: 'CS2' });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/games/${GAME_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('delete', () => {
    it('calls DELETE /admin/v1/games/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      await createAdminGamesClient(client).delete(GAME_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/games/${GAME_ID}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminGamesClient surface — no extra methods', () => {
  const adminClient = createAdminGamesClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: list, get, create, update, delete', () => {
    expect(typeof adminClient.list).toBe('function');
    expect(typeof adminClient.get).toBe('function');
    expect(typeof adminClient.create).toBe('function');
    expect(typeof adminClient.update).toBe('function');
    expect(typeof adminClient.delete).toBe('function');
  });

  it('has no updateStatus method (not locked)', () => {
    expect('updateStatus' in adminClient).toBe(false);
  });

  it('has no getById alias (locked name is get)', () => {
    expect('getById' in adminClient).toBe(false);
  });

  it('has no getBySlug method (not locked for admin)', () => {
    expect('getBySlug' in adminClient).toBe(false);
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
const GAMES_FEATURE_FILES = [
  ...collectFiles(join(ADMIN_ROOT, 'features', 'games'), ['.ts', '.vue'], ['.spec.ts']),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('useAdminGames'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'components', 'games'), ['.vue']),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'games'), ['.vue']),
];

// ─── Admin games routes exist ─────────────────────────────────────────────────

describe('admin games routes — file existence', () => {
  const GAMES_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'games'), ['.vue']);

  it('/games route exists (pages/games/index.vue)', () => {
    const hasIndex = GAMES_PAGES.some((f) => f.replace(/\\/g, '/').endsWith('/games/index.vue'));
    expect(hasIndex).toBe(true);
  });

  it('/games/new route exists (pages/games/new.vue)', () => {
    const hasNew = GAMES_PAGES.some((f) => f.replace(/\\/g, '/').endsWith('/games/new.vue'));
    expect(hasNew).toBe(true);
  });

  it('/games/:id/edit route exists (pages/games/[id]/edit.vue)', () => {
    const hasEdit = GAMES_PAGES.some((f) => f.replace(/\\/g, '/').includes('/games/[id]/edit.vue'));
    expect(hasEdit).toBe(true);
  });

  it('no game page file has /admin prefix in its route path', () => {
    for (const file of GAMES_PAGES) {
      const normalized = file.replace(/\\/g, '/');
      expect(normalized).not.toMatch(/\/pages\/admin\/games\//);
    }
  });
});

// ─── No direct fetch in games files ──────────────────────────────────────────

describe('games files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('games feature/composable/component/page files do not call fetch() directly', () => {
    for (const file of GAMES_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No fake game data ────────────────────────────────────────────────────────

describe('games files — no fake game data', () => {
  const FAKE_DATA_PATTERNS = [
    { label: 'Fake Game', pattern: /Fake\s+Game/i },
    { label: 'Test Game', pattern: /Test\s+Game/i },
    { label: 'mockGame assignment', pattern: /\bmockGame\s*=\s*\{/ },
    { label: 'fakeGame assignment', pattern: /\bfakeGame\s*=\s*\{/ },
  ];

  it('games source files do not contain fake/mock game data', () => {
    const sourceFiles = [
      ...collectFiles(join(ADMIN_ROOT, 'features', 'games'), ['.ts', '.vue'], ['.spec.ts']),
      ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
        f.includes('useAdminGames'),
      ),
      ...collectFiles(join(ADMIN_ROOT, 'components', 'games'), ['.vue']),
      ...collectFiles(join(ADMIN_ROOT, 'pages', 'games'), ['.vue']),
    ];

    for (const file of sourceFiles) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_DATA_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake game data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains in games files ─────────────────────────────────────

describe('games files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('games source files do not hardcode localhost as API origin', () => {
    for (const file of GAMES_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('games source files do not hardcode qesb.ir as API origin', () => {
    for (const file of GAMES_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission strings — no raw strings ─────────────────────────────────────

describe('games files — centralized permissions only', () => {
  it('games pages use DragonPermissions constants (no raw tournament.game strings in quotes)', () => {
    const pages = collectFiles(join(ADMIN_ROOT, 'pages', 'games'), ['.vue']);
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.game\.(read|manage)'/);
      expect(src).not.toMatch(/"tournament\.game\.(read|manage)"/);
    }
  });
});
