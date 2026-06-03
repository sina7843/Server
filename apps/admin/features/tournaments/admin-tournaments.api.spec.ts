/**
 * Admin tournaments feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - Admin tournament routes exist without /admin prefix
 *   - No direct fetch() in the tournaments feature/composable files
 *   - No fake tournament data in tournaments files
 *   - SDK surface did not expand beyond locked tournament methods
 *   - No hardcoded localhost/qesb.ir in tournaments files
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { ApiClientError, createAdminTournamentsClient, createApiClient } from '@dragon/sdk';

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

const mockTournament = {
  id: TOURNAMENT_ID,
  gameId: '507f1f77bcf86cd799439012',
  title: 'جام اژدها ۱۴۰۵',
  slug: 'dragon-cup-1405',
  format: 'single_elimination',
  participantType: 'individual',
  capacity: 64,
  status: 'draft',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockList = { items: [mockTournament], total: 1, page: 1, limit: 20 };

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentsClient — SDK delegation', () => {
  describe('list', () => {
    it('calls GET /admin/v1/tournaments without params', async () => {
      mockJson(mockList);
      const result = await createAdminTournamentsClient(client).list();
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/v1/tournaments',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends status query param when provided', async () => {
      mockJson(mockList);
      await createAdminTournamentsClient(client).list({ status: 'draft' });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('status=draft');
    });

    it('appends format query param when provided', async () => {
      mockJson(mockList);
      await createAdminTournamentsClient(client).list({ format: 'single_elimination' });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('format=single_elimination');
    });

    it('appends page and limit query params', async () => {
      mockJson(mockList);
      await createAdminTournamentsClient(client).list({ page: 2, limit: 10 });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('appends gameId query param when provided', async () => {
      mockJson(mockList);
      const gameId = '507f1f77bcf86cd799439012';
      await createAdminTournamentsClient(client).list({ gameId });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain(`gameId=${gameId}`);
    });
  });

  describe('get', () => {
    it('calls GET /admin/v1/tournaments/:id', async () => {
      mockJson(mockTournament);
      const result = await createAdminTournamentsClient(client).get(TOURNAMENT_ID);
      expect(result.id).toBe(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(createAdminTournamentsClient(client).get('bad-id')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('create', () => {
    it('calls POST /admin/v1/tournaments with JSON body', async () => {
      mockJson(mockTournament);
      await createAdminTournamentsClient(client).create({
        gameId: '507f1f77bcf86cd799439012',
        title: 'جام اژدها ۱۴۰۵',
        slug: 'dragon-cup-1405',
        format: 'single_elimination',
        capacity: 64,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/v1/tournaments',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('forwards participantType in request body', async () => {
      mockJson(mockTournament);
      await createAdminTournamentsClient(client).create({
        gameId: '507f1f77bcf86cd799439012',
        title: 'جام اژدها ۱۴۰۵',
        slug: 'dragon-cup-1405',
        format: 'single_elimination',
        capacity: 64,
        participantType: 'team',
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.participantType).toBe('team');
    });
  });

  describe('update', () => {
    it('calls PATCH /admin/v1/tournaments/:id', async () => {
      mockJson(mockTournament);
      await createAdminTournamentsClient(client).update(TOURNAMENT_ID, { title: 'عنوان جدید' });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('delete', () => {
    it('calls DELETE /admin/v1/tournaments/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      await createAdminTournamentsClient(client).delete(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('lifecycle actions', () => {
    it('publish calls POST /admin/v1/tournaments/:id/publish', async () => {
      mockJson({ ...mockTournament, status: 'published' });
      await createAdminTournamentsClient(client).publish(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/publish`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('openRegistration calls POST /admin/v1/tournaments/:id/open-registration', async () => {
      mockJson({ ...mockTournament, status: 'registration_open' });
      await createAdminTournamentsClient(client).openRegistration(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/open-registration`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('closeRegistration calls POST /admin/v1/tournaments/:id/close-registration', async () => {
      mockJson({ ...mockTournament, status: 'registration_closed' });
      await createAdminTournamentsClient(client).closeRegistration(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/close-registration`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('start calls POST /admin/v1/tournaments/:id/start', async () => {
      mockJson({ ...mockTournament, status: 'in_progress' });
      await createAdminTournamentsClient(client).start(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/start`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('complete calls POST /admin/v1/tournaments/:id/complete', async () => {
      mockJson({ ...mockTournament, status: 'completed' });
      await createAdminTournamentsClient(client).complete(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/complete`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('cancel calls POST /admin/v1/tournaments/:id/cancel', async () => {
      mockJson({ ...mockTournament, status: 'cancelled' });
      await createAdminTournamentsClient(client).cancel(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/cancel`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('archive calls POST /admin/v1/tournaments/:id/archive', async () => {
      mockJson({ ...mockTournament, status: 'archived' });
      await createAdminTournamentsClient(client).archive(TOURNAMENT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/archive`,
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentsClient surface — no extra methods', () => {
  const adminClient = createAdminTournamentsClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: list, get, create, update, delete, publish, openRegistration, closeRegistration, start, complete, cancel, archive', () => {
    expect(typeof adminClient.list).toBe('function');
    expect(typeof adminClient.get).toBe('function');
    expect(typeof adminClient.create).toBe('function');
    expect(typeof adminClient.update).toBe('function');
    expect(typeof adminClient.delete).toBe('function');
    expect(typeof adminClient.publish).toBe('function');
    expect(typeof adminClient.openRegistration).toBe('function');
    expect(typeof adminClient.closeRegistration).toBe('function');
    expect(typeof adminClient.start).toBe('function');
    expect(typeof adminClient.complete).toBe('function');
    expect(typeof adminClient.cancel).toBe('function');
    expect(typeof adminClient.archive).toBe('function');
  });

  it('has no updateStatus method (lifecycle uses explicit endpoints)', () => {
    expect('updateStatus' in adminClient).toBe(false);
  });

  it('has no getById alias (locked name is get)', () => {
    expect('getById' in adminClient).toBe(false);
  });

  it('has no getBySlug method (not locked for admin)', () => {
    expect('getBySlug' in adminClient).toBe(false);
  });

  it('has no register method (registration is out of scope)', () => {
    expect('register' in adminClient).toBe(false);
  });

  it('has no addParticipant method (participant management is out of scope)', () => {
    expect('addParticipant' in adminClient).toBe(false);
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
const TOURNAMENT_FEATURE_FILES = [
  ...collectFiles(join(ADMIN_ROOT, 'features', 'tournaments'), ['.ts', '.vue'], ['.spec.ts']),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('useAdminTournaments'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']),
];

// ─── Admin tournament routes exist ───────────────────────────────────────────

describe('admin tournaments routes — file existence', () => {
  const TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

  it('/tournaments route exists (pages/tournaments/index.vue)', () => {
    const hasIndex = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').endsWith('/tournaments/index.vue'),
    );
    expect(hasIndex).toBe(true);
  });

  it('/tournaments/new route exists (pages/tournaments/new.vue)', () => {
    const hasNew = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').endsWith('/tournaments/new.vue'),
    );
    expect(hasNew).toBe(true);
  });

  it('/tournaments/:id route exists (pages/tournaments/[id]/index.vue)', () => {
    const hasDetail = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/index.vue'),
    );
    expect(hasDetail).toBe(true);
  });

  it('/tournaments/:id/edit route exists (pages/tournaments/[id]/edit.vue)', () => {
    const hasEdit = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/edit.vue'),
    );
    expect(hasEdit).toBe(true);
  });

  it('no tournament page file has /admin prefix in its route path', () => {
    for (const file of TOURNAMENT_PAGES) {
      const normalized = file.replace(/\\/g, '/');
      expect(normalized).not.toMatch(/\/pages\/admin\/tournaments\//);
    }
  });

  it('no standalone /tournaments/:id/operations page exists (hub is on detail page)', () => {
    const hasOps = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/operations'),
    );
    expect(hasOps).toBe(false);
  });

  it('no standalone /tournaments/:id/preview page exists', () => {
    const hasPreview = TOURNAMENT_PAGES.some((f) =>
      f.replace(/\\/g, '/').includes('/tournaments/[id]/preview'),
    );
    expect(hasPreview).toBe(false);
  });
});

// ─── No direct fetch in tournaments files ────────────────────────────────────

describe('tournaments files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('tournaments feature/composable/component/page files do not call fetch() directly', () => {
    for (const file of TOURNAMENT_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No fake tournament data ─────────────────────────────────────────────────

describe('tournaments files — no fake tournament data', () => {
  const FAKE_DATA_PATTERNS = [
    { label: 'Fake Tournament', pattern: /Fake\s+Tournament/i },
    { label: 'Test Tournament', pattern: /Test\s+Tournament/i },
    { label: 'mockTournament assignment', pattern: /\bmockTournament\s*=\s*\{/ },
    { label: 'fakeTournament assignment', pattern: /\bfakeTournament\s*=\s*\{/ },
  ];

  it('tournaments source files do not contain fake/mock tournament data', () => {
    const sourceFiles = [
      ...collectFiles(join(ADMIN_ROOT, 'features', 'tournaments'), ['.ts', '.vue'], ['.spec.ts']),
      ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
        f.includes('useAdminTournaments'),
      ),
      ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']),
      ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']),
    ];

    for (const file of sourceFiles) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_DATA_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake tournament data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains in tournaments files ────────────────────────────────

describe('tournaments files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('tournaments source files do not hardcode localhost as API origin', () => {
    for (const file of TOURNAMENT_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('tournaments source files do not hardcode qesb.ir as API origin', () => {
    for (const file of TOURNAMENT_FEATURE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission strings — no raw strings ─────────────────────────────────────

describe('tournaments files — centralized permissions only', () => {
  it('tournaments pages use DragonPermissions constants (no raw tournament permission strings in quotes)', () => {
    const pages = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(
        /'tournament\.tournament\.(read|create|update|delete|publish|cancel|archive)'/,
      );
      expect(src).not.toMatch(
        /"tournament\.tournament\.(read|create|update|delete|publish|cancel|archive)"/,
      );
    }
  });
});

// ─── Scope guardrails ────────────────────────────────────────────────────────

describe('tournaments scope guardrails — no out-of-scope features', () => {
  it('tournament pages do not contain public registration UI', () => {
    const pages = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/my-registration/i);
      expect(src).not.toMatch(/register-now/i);
    }
  });

  it('non-bracket tournament pages do not contain bracket UI components', () => {
    const pages = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter(
      (f) => !f.replace(/\\/g, '/').includes('/bracket'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
    }
  });

  it('tournament pages do not contain result entry or standings UI', () => {
    const pages = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/StandingsTable/i);
      expect(src).not.toMatch(/ResultEntry/i);
    }
  });

  it('tournament feature API does not expose participant or registration methods', () => {
    const featureFiles = collectFiles(
      join(ADMIN_ROOT, 'features', 'tournaments'),
      ['.ts'],
      ['.spec.ts'],
    );
    for (const file of featureFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/addParticipant/i);
      expect(src).not.toMatch(/registerParticipant/i);
      expect(src).not.toMatch(/createRegistration/i);
    }
  });
});
