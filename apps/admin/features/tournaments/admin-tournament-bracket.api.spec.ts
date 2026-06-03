/**
 * Admin tournament bracket feature API — SDK delegation and route guardrails.
 *
 * Verifies:
 *   - getBracket delegates to admin.tournaments.getBracket() (not a separate bracket client)
 *   - /tournaments/:id/bracket route exists without /admin prefix
 *   - No direct fetch() in bracket feature/composable/page files
 *   - No public SDK used for admin bracket workflows
 *   - No fake bracket data in source files
 *   - No hardcoded localhost/qesb.ir in bracket source files
 *   - Permission constants used (no raw permission strings)
 *   - Bracket page is read-only: no editor, no drag/drop, no mutations
 *   - No admin.tournamentBracket.get() — bracket access is via admin.tournaments.getBracket()
 *   - No TournamentBracket collection/model
 *   - No Swiss/Double Elimination UI
 *   - Bracket read uses TOURNAMENT_MATCH_READ permission
 *   - No /admin prefix in route file paths
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createAdminTournamentsClient, createApiClient, ApiClientError } from '@dragon/sdk';

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

const mockBracket = {
  tournamentId: TOURNAMENT_ID,
  format: 'single_elimination',
  rounds: [
    {
      round: 1,
      label: 'دور ۱',
      matches: [
        {
          matchId: '507f1f77bcf86cd799439055',
          round: 1,
          matchNumber: 1,
          participant1: { participantId: 'p1', displayName: 'Team Alpha', seed: 1 },
          participant2: { participantId: 'p2', displayName: 'Team Beta', seed: 2 },
          winnerId: 'p1',
          status: 'completed',
        },
      ],
    },
  ],
  generatedAt: '2026-06-01T10:00:00.000Z',
};

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('createAdminTournamentsClient.getBracket — SDK delegation', () => {
  it('calls GET /admin/v1/tournaments/:id/bracket', async () => {
    mockJson(mockBracket);
    const result = await createAdminTournamentsClient(client).getBracket(TOURNAMENT_ID);
    expect(result.tournamentId).toBe(TOURNAMENT_ID);
    expect(result.rounds).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `http://localhost:3001/admin/v1/tournaments/${TOURNAMENT_ID}/bracket`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns bracket with round data', async () => {
    mockJson(mockBracket);
    const result = await createAdminTournamentsClient(client).getBracket(TOURNAMENT_ID);
    expect(result.rounds[0]?.label).toBe('دور ۱');
    expect(result.rounds[0]?.matches).toHaveLength(1);
  });

  it('throws ApiClientError on 404', async () => {
    mockJson({ message: 'Not found' }, 404);
    await expect(createAdminTournamentsClient(client).getBracket('bad-id')).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(
      createAdminTournamentsClient(client).getBracket(TOURNAMENT_ID),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});

// ─── No separate bracket SDK client ──────────────────────────────────────────

describe('bracket SDK access policy', () => {
  it('bracket is accessed via AdminTournamentsClient.getBracket (not a separate bracket client)', () => {
    const tournamentsClient = createAdminTournamentsClient({ request: jest.fn() } as never);
    expect(typeof tournamentsClient.getBracket).toBe('function');
  });

  it('AdminTournamentsClient has no bracket mutation methods', () => {
    const tournamentsClient = createAdminTournamentsClient({ request: jest.fn() } as never);
    expect('updateBracket' in tournamentsClient).toBe(false);
    expect('createBracket' in tournamentsClient).toBe(false);
    expect('deleteBracket' in tournamentsClient).toBe(false);
    expect('setBracketNode' in tournamentsClient).toBe(false);
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

const BRACKET_SOURCE_FILES = [
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => f.includes('bracket')),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) =>
    f.includes('Bracket'),
  ),
  ...collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']).filter((f) =>
    f.includes('bracket'),
  ),
];

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

// ─── Route existence ──────────────────────────────────────────────────────────

describe('admin bracket routes — file existence', () => {
  it('/tournaments/:id/bracket route exists', () => {
    const exists = ALL_TOURNAMENT_PAGES.some(
      (f) =>
        f.replace(/\\/g, '/').includes('/tournaments/[id]/bracket.vue') ||
        f.replace(/\\/g, '/').includes('/tournaments/[id]/bracket/index.vue'),
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

// ─── No direct fetch in bracket source files ──────────────────────────────────

describe('bracket source files — no direct fetch()', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('bracket source files do not call fetch() directly', () => {
    for (const file of BRACKET_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers instead.`);
      }
    }
  });
});

// ─── No $fetch or axios ───────────────────────────────────────────────────────

describe('bracket source files — no $fetch or axios', () => {
  it('bracket pages do not use $fetch', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('bracket pages do not import axios', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });
});

// ─── No fake bracket data ─────────────────────────────────────────────────────

describe('bracket source files — no fake bracket data', () => {
  const FAKE_PATTERNS = [
    { label: 'Fake Bracket', pattern: /Fake\s+Bracket/i },
    { label: 'mockBracket assignment', pattern: /\bmockBracket\s*=\s*\{/ },
    { label: 'fakeBracket assignment', pattern: /\bfakeBracket\s*=\s*\{/ },
  ];

  it('bracket source files do not contain fake/mock bracket data', () => {
    for (const file of BRACKET_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake bracket data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded domains ─────────────────────────────────────────────────────

describe('bracket source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('bracket source files do not hardcode localhost as API origin', () => {
    for (const file of BRACKET_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('bracket source files do not hardcode qesb.ir as API origin', () => {
    for (const file of BRACKET_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Permission constants ────────────────────────────────────────────────────

describe('bracket pages — centralized permissions only', () => {
  it('bracket pages use DragonPermissions constants (no raw permission strings)', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/'tournament\.match\.read'/);
      expect(src).not.toMatch(/"tournament\.match\.read"/);
    }
  });

  it('bracket pages use TOURNAMENT_MATCH_READ for read access', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_MATCH_READ/);
    }
  });
});

// ─── Scope guardrails: read-only bracket ─────────────────────────────────────

describe('bracket pages — read-only policy guardrails', () => {
  it('bracket pages do not contain bracket editor UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
    }
  });

  it('bracket pages do not contain drag/drop controls', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/draggable/i);
      expect(src).not.toMatch(/v-draggable/i);
      expect(src).not.toMatch(/onDragStart/i);
      expect(src).not.toMatch(/onDrop/i);
    }
  });

  it('bracket pages do not contain bracket mutation calls', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/updateBracket/i);
      expect(src).not.toMatch(/createBracket/i);
      expect(src).not.toMatch(/setBracketNode/i);
    }
  });

  it('bracket pages do not contain Swiss or Double Elimination UI', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/swiss.*pairing/i);
      expect(src).not.toMatch(/double.*elimination.*editor/i);
    }
  });

  it('bracket pages do not use public SDK for admin workflows', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });

  it('bracket pages use useAdminTournamentBracket composable', () => {
    const pages = ALL_TOURNAMENT_PAGES.filter((f) => f.replace(/\\/g, '/').includes('bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentBracket/);
    }
  });
});

// ─── No admin.tournamentBracket.get() ────────────────────────────────────────

describe('no separate admin tournament bracket SDK client', () => {
  it('bracket feature API uses createAdminTournamentsClient (not a separate bracket factory)', () => {
    const bracketApiFiles = collectFiles(
      join(ADMIN_ROOT, 'features', 'tournaments'),
      ['.ts'],
      ['.spec.ts'],
    ).filter((f) => f.includes('bracket'));

    for (const file of bracketApiFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createAdminTournamentBracketClient/);
    }
  });

  it('no createAdminTournamentBracketClient exists anywhere in admin source', () => {
    const allFiles = collectFiles(join(ADMIN_ROOT), ['.ts', '.vue'], ['.spec.ts']);
    for (const file of allFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createAdminTournamentBracketClient/);
    }
  });
});
