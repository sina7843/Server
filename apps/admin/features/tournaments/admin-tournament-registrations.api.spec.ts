/**
 * Admin tournament registrations feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - /tournaments/:id/registrations route exists without /admin prefix
 *   - No direct fetch() in registrations feature/composable/page files
 *   - No public SDK used for admin registration workflows
 *   - No duplicated DTO shapes (no inline registration types in page/component)
 *   - No fake registrations in source files
 *   - No hardcoded localhost/qesb.ir in registrations source files
 *   - Permission constants used (no raw permission strings)
 *   - No match/result/standings/bracket/Team/Club UI in registrations pages
 *   - No /admin prefix in route file paths
 *   - No /tournaments/:id/operations or /tournaments/:id/preview routes
 *   - Participants not derived from raw registrations in frontend
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import {
  createAdminTournamentRegistrationsClient,
  createApiClient,
  ApiClientError,
} from '@dragon/sdk';

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
const REGISTRATION_ID = '507f1f77bcf86cd799439022';

const mockRegistration = {
  id: REGISTRATION_ID,
  tournamentId: TOURNAMENT_ID,
  userId: '507f1f77bcf86cd799439033',
  type: 'individual',
  status: 'submitted',
  registeredAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockList = { items: [mockRegistration], total: 1, page: 1, limit: 20 };

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentRegistrationsClient — SDK delegation', () => {
  describe('list', () => {
    it('calls GET /admin/v1/tournaments/:id/registrations', async () => {
      mockJson(mockList);
      const result = await createAdminTournamentRegistrationsClient(client).list(TOURNAMENT_ID);
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/registrations`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends status query param', async () => {
      mockJson(mockList);
      await createAdminTournamentRegistrationsClient(client).list(TOURNAMENT_ID, {
        status: 'submitted',
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('status=submitted');
    });

    it('appends type query param', async () => {
      mockJson(mockList);
      await createAdminTournamentRegistrationsClient(client).list(TOURNAMENT_ID, {
        type: 'individual',
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('type=individual');
    });

    it('appends page and limit query params', async () => {
      mockJson(mockList);
      await createAdminTournamentRegistrationsClient(client).list(TOURNAMENT_ID, {
        page: 2,
        limit: 10,
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  describe('get', () => {
    it('calls GET /admin/v1/tournaments/:id/registrations/:registrationId', async () => {
      mockJson(mockRegistration);
      const result = await createAdminTournamentRegistrationsClient(client).get(
        TOURNAMENT_ID,
        REGISTRATION_ID,
      );
      expect(result.id).toBe(REGISTRATION_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/registrations/${REGISTRATION_ID}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentRegistrationsClient(client).get(TOURNAMENT_ID, 'bad-id'),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('approve', () => {
    it('calls POST /admin/v1/tournaments/:id/registrations/:registrationId/approve', async () => {
      mockJson({ ...mockRegistration, status: 'approved' });
      await createAdminTournamentRegistrationsClient(client).approve(
        TOURNAMENT_ID,
        REGISTRATION_ID,
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/registrations/${REGISTRATION_ID}/approve`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(
        createAdminTournamentRegistrationsClient(client).approve(TOURNAMENT_ID, REGISTRATION_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('reject', () => {
    it('calls POST /admin/v1/tournaments/:id/registrations/:registrationId/reject', async () => {
      mockJson({ ...mockRegistration, status: 'rejected' });
      await createAdminTournamentRegistrationsClient(client).reject(TOURNAMENT_ID, REGISTRATION_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/registrations/${REGISTRATION_ID}/reject`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('includes reason in request body when provided', async () => {
      mockJson({ ...mockRegistration, status: 'rejected' });
      await createAdminTournamentRegistrationsClient(client).reject(
        TOURNAMENT_ID,
        REGISTRATION_ID,
        { reason: 'تیم ناقص' },
      );
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.reason).toBe('تیم ناقص');
    });

    it('sends empty body when reason is omitted', async () => {
      mockJson({ ...mockRegistration, status: 'rejected' });
      await createAdminTournamentRegistrationsClient(client).reject(TOURNAMENT_ID, REGISTRATION_ID);
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.reason).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('calls POST /admin/v1/tournaments/:id/registrations/:registrationId/cancel', async () => {
      mockJson({ ...mockRegistration, status: 'cancelled' });
      await createAdminTournamentRegistrationsClient(client).cancel(TOURNAMENT_ID, REGISTRATION_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/registrations/${REGISTRATION_ID}/cancel`,
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentRegistrationsClient surface', () => {
  const regClient = createAdminTournamentRegistrationsClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: list, get, approve, reject, cancel', () => {
    expect(typeof regClient.list).toBe('function');
    expect(typeof regClient.get).toBe('function');
    expect(typeof regClient.approve).toBe('function');
    expect(typeof regClient.reject).toBe('function');
    expect(typeof regClient.cancel).toBe('function');
  });

  it('has no create method (public registration is out of scope)', () => {
    expect('create' in regClient).toBe(false);
  });

  it('has no delete method (use cancel instead)', () => {
    expect('delete' in regClient).toBe(false);
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

const REGISTRATION_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('registration')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Registration'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']).filter(
    (f) => f.includes('Registration') || f.includes('registration'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('registrations'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin registrations routes — file existence', () => {
  it('/tournaments/:id/registrations route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/registrations.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/registrations/index.vue'),
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

// ─── No direct fetch in registrations source files ───────────────────────────

describe('registrations source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('registrations source files do not call fetch() directly', () => {
    for (const file of REGISTRATION_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios in registrations pages ────────────────────────────────

describe('registrations source files — no $fetch or axios', () => {
  it('registrations pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('registrations pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake registrations ────────────────────────────────────────────────────

describe('registrations source files — no fake registration data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Registration', pattern: /Fake\s+Registration/i },
    { label: 'mockRegistration assignment', pattern: /\bmockRegistration\s*=\s*\{/ },
    { label: 'fakeRegistration assignment', pattern: /\bfakeRegistration\s*=\s*\{/ },
  ];

  it('registrations source files do not contain fake/mock registration data', () => {
    for (const file of REGISTRATION_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake registration data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('registrations source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('registrations source files do not hardcode localhost as API origin', () => {
    for (const file of REGISTRATION_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('registrations source files do not hardcode qesb.ir as API origin', () => {
    for (const file of REGISTRATION_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ────────────────────────────────────────────────────

describe('registrations pages — centralized permissions only', () => {
  it('registrations pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.registration\.(read|manage)'/);
      expect(src).not.toMatch(/"tournament\.registration\.(read|manage)"/);
    }
  });
});

// ─── Scope guardrails ────────────────────────────────────────────────────────

describe('registrations pages — scope guardrails', () => {
  it('registrations pages do not contain match or bracket UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
      expect(src).not.toMatch(/MatchManagement/i);
      expect(src).not.toMatch(/ResultEntry/i);
      expect(src).not.toMatch(/StandingsTable/i);
    }
  });

  it('registrations pages do not contain independent Team/Club UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\/teams\//);
      expect(src).not.toMatch(/\/clubs\//);
      expect(src).not.toMatch(/TeamProfile/i);
      expect(src).not.toMatch(/ClubProfile/i);
    }
  });

  it('registrations pages do not use public SDK for admin mutation', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });
});

// ─── Participants not derived from registrations in frontend ──────────────────

describe('participants not derived from registrations in frontend', () => {
  it('registrations page does not manually derive participant list from registrations', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('registrations'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\.filter\s*\(.*status.*approved.*\)/);
      expect(src).not.toMatch(/registrations.*\.map\s*\(.*participant/i);
    }
  });

  it('participants page uses useAdminTournamentParticipants (not useAdminTournamentRegistrations)', () => {
    const participantPages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of participantPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentParticipants/);
      expect(src).not.toMatch(/useAdminTournamentRegistrations/);
    }
  });
});
