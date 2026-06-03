/**
 * Admin tournament participants feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - Each feature function delegates to the correct locked SDK method
 *   - /tournaments/:id/participants route exists without /admin prefix
 *   - No direct fetch() in participants feature/composable/page files
 *   - No public SDK used for admin participant workflows
 *   - No fake participants in source files
 *   - No hardcoded localhost/qesb.ir in participants source files
 *   - Permission constants used (no raw permission strings)
 *   - No match/result/standings/bracket/Team/Club UI in participants pages
 *   - Participants are not derived from raw registrations in frontend
 *   - No /admin prefix in route file paths
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import {
  createAdminTournamentParticipantsClient,
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
const PARTICIPANT_ID = '507f1f77bcf86cd799439044';

const mockParticipant = {
  id: PARTICIPANT_ID,
  userId: '507f1f77bcf86cd799439033',
  displayName: 'آرش کمانگیر',
  seed: 1,
  status: 'active',
};

const mockList = { items: [mockParticipant], total: 1, page: 1, limit: 20 };

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentParticipantsClient — SDK delegation', () => {
  describe('list', () => {
    it('calls GET /admin/v1/tournaments/:id/participants', async () => {
      mockJson(mockList);
      const result = await createAdminTournamentParticipantsClient(client).list(TOURNAMENT_ID);
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/participants`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends status query param', async () => {
      mockJson(mockList);
      await createAdminTournamentParticipantsClient(client).list(TOURNAMENT_ID, {
        status: 'active',
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('status=active');
    });

    it('appends page and limit query params', async () => {
      mockJson(mockList);
      await createAdminTournamentParticipantsClient(client).list(TOURNAMENT_ID, {
        page: 2,
        limit: 10,
      });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  describe('update', () => {
    it('calls PATCH /admin/v1/tournaments/:id/participants/:participantId', async () => {
      mockJson({ ...mockParticipant, displayName: 'سیاوش', seed: 2 });
      await createAdminTournamentParticipantsClient(client).update(TOURNAMENT_ID, PARTICIPANT_ID, {
        displayName: 'سیاوش',
        seed: 2,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/participants/${PARTICIPANT_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('includes displayName in request body', async () => {
      mockJson({ ...mockParticipant, displayName: 'سیاوش' });
      await createAdminTournamentParticipantsClient(client).update(TOURNAMENT_ID, PARTICIPANT_ID, {
        displayName: 'سیاوش',
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.displayName).toBe('سیاوش');
    });

    it('includes seed in request body', async () => {
      mockJson({ ...mockParticipant, seed: 3 });
      await createAdminTournamentParticipantsClient(client).update(TOURNAMENT_ID, PARTICIPANT_ID, {
        seed: 3,
      });
      const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as { body: string })?.body ?? '{}');
      expect(body.seed).toBe(3);
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(
        createAdminTournamentParticipantsClient(client).update(TOURNAMENT_ID, 'bad-id', {
          displayName: 'test',
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('remove', () => {
    it('calls POST /admin/v1/tournaments/:id/participants/:participantId/remove', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      await createAdminTournamentParticipantsClient(client).remove(TOURNAMENT_ID, PARTICIPANT_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/participants/${PARTICIPANT_ID}/remove`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(
        createAdminTournamentParticipantsClient(client).remove(TOURNAMENT_ID, PARTICIPANT_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('disqualify', () => {
    it('calls POST /admin/v1/tournaments/:id/participants/:participantId/disqualify', async () => {
      mockJson({ ...mockParticipant, status: 'disqualified' });
      await createAdminTournamentParticipantsClient(client).disqualify(
        TOURNAMENT_ID,
        PARTICIPANT_ID,
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/participants/${PARTICIPANT_ID}/disqualify`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns updated participant with disqualified status', async () => {
      mockJson({ ...mockParticipant, status: 'disqualified' });
      const result = await createAdminTournamentParticipantsClient(client).disqualify(
        TOURNAMENT_ID,
        PARTICIPANT_ID,
      );
      expect(result.status).toBe('disqualified');
    });
  });
});

// ─── SDK surface guardrail ────────────────────────────────────────────────────

describe('AdminTournamentParticipantsClient surface', () => {
  const partClient = createAdminTournamentParticipantsClient({ request: jest.fn() } as never);

  it('exposes exactly the locked methods: list, update, remove, disqualify', () => {
    expect(typeof partClient.list).toBe('function');
    expect(typeof partClient.update).toBe('function');
    expect(typeof partClient.remove).toBe('function');
    expect(typeof partClient.disqualify).toBe('function');
  });

  it('has no create method (participants come from approved registrations)', () => {
    expect('create' in partClient).toBe(false);
  });

  it('has no delete method (use remove instead)', () => {
    expect('delete' in partClient).toBe(false);
  });

  it('has no get method (not in locked surface)', () => {
    expect('get' in partClient).toBe(false);
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

const PARTICIPANT_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('participant')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Participant'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'components', 'tournaments'), ['.vue']).filter(
    (f) => f.includes('Participant') || f.includes('participant'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('participants'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin participants routes — file existence', () => {
  it('/tournaments/:id/participants route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/participants.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/participants/index.vue'),
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

// ─── No direct fetch in participants source files ─────────────────────────────

describe('participants source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('participants source files do not call fetch() directly', () => {
    for (const file of PARTICIPANT_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios ───────────────────────────────────────────────────────

describe('participants source files — no $fetch or axios', () => {
  it('participants pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('participants pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake participants ─────────────────────────────────────────────────────

describe('participants source files — no fake participant data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Participant', pattern: /Fake\s+Participant/i },
    { label: 'mockParticipant assignment', pattern: /\bmockParticipant\s*=\s*\{/ },
    { label: 'fakeParticipant assignment', pattern: /\bfakeParticipant\s*=\s*\{/ },
  ];

  it('participants source files do not contain fake/mock participant data', () => {
    for (const file of PARTICIPANT_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake participant data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('participants source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('participants source files do not hardcode localhost as API origin', () => {
    for (const file of PARTICIPANT_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('participants source files do not hardcode qesb.ir as API origin', () => {
    for (const file of PARTICIPANT_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ─────────────────────────────────────────────────────

describe('participants pages — centralized permissions only', () => {
  it('participants pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.participant\.(read|manage)'/);
      expect(src).not.toMatch(/"tournament\.participant\.(read|manage)"/);
    }
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('participants pages — scope guardrails', () => {
  it('participants pages do not contain match or bracket UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
      expect(src).not.toMatch(/MatchManagement/i);
      expect(src).not.toMatch(/ResultEntry/i);
      expect(src).not.toMatch(/StandingsTable/i);
    }
  });

  it('participants pages do not contain independent Team/Club profile links', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/TeamProfile/i);
      expect(src).not.toMatch(/ClubProfile/i);
      expect(src).not.toMatch(/\/teams\//);
      expect(src).not.toMatch(/\/clubs\//);
    }
  });

  it('participants pages do not use public SDK for admin mutation', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });

  it('participants pages do not contain placeholder/coming-soon buttons', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/coming.?soon/i);
      expect(src).not.toMatch(/placeholder.*action/i);
    }
  });
});

// ─── Participants not derived from registrations ───────────────────────────────

describe('participants page — not derived from registrations', () => {
  it('participants page uses useAdminTournamentParticipants composable', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentParticipants/);
    }
  });

  it('participants page does not use useAdminTournamentRegistrations', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/useAdminTournamentRegistrations/);
    }
  });

  it('participants page does not derive participants from registrations list', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('participants'),
    );
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/registrations.*\.filter\s*\(/);
      expect(src).not.toMatch(/registrations.*\.map\s*\(.*participant/i);
    }
  });
});
