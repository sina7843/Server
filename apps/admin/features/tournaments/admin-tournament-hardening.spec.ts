/**
 * Slice 10 hardening — admin tournament operational UI.
 *
 * Verifies:
 *   - TournamentOperationalHub links to all 6 operational routes
 *   - No /operations or /preview links in the hub
 *   - All 6 operation sub-route pages exist
 *   - All operational pages use admin SDK only (no direct fetch/$fetch/axios)
 *   - All operational pages use DragonPermissions constants (no raw strings)
 *   - No fake operational data in UI source files
 *   - No bracket editor, drag-drop, or live scoring in operational pages
 *   - No public SDK used for admin operational workflows
 *   - No Swiss/double-elimination format UI
 *   - No client-side standings/results computation as source of truth
 *   - No /admin prefix in page route file paths
 *   - No hardcoded API domains in operational source files
 *   - Composables used: correct composable per page
 *   - Hub navigation section rendered only for permitted users
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

// ─── Paths ────────────────────────────────────────────────────────────────────

const ADMIN_ROOT = join(__dirname, '..', '..');

const ALL_TOURNAMENT_PAGES = collectFiles(join(ADMIN_ROOT, 'pages', 'tournaments'), ['.vue']);

const OPERATIONAL_PAGES = ALL_TOURNAMENT_PAGES.filter((f) => {
  const n = f.replace(/\\/g, '/');
  return (
    n.includes('/registrations') ||
    n.includes('/participants') ||
    n.includes('/matches') ||
    n.includes('/results') ||
    n.includes('/standings') ||
    n.includes('/bracket')
  );
});

const OPERATIONAL_SOURCE_FILES = [
  ...OPERATIONAL_PAGES,
  ...collectFiles(
    join(ADMIN_ROOT, 'features', 'tournaments'),
    ['.ts', '.vue'],
    ['.spec.ts'],
  ).filter((f) => {
    const n = f.replace(/\\/g, '/');
    return (
      n.includes('match') ||
      n.includes('result') ||
      n.includes('participant') ||
      n.includes('registration') ||
      n.includes('standing') ||
      n.includes('bracket')
    );
  }),
  ...collectFiles(join(ADMIN_ROOT, 'composables'), ['.ts'], ['.spec.ts']).filter((f) => {
    const n = f.replace(/\\/g, '/');
    return (
      n.includes('Match') ||
      n.includes('Result') ||
      n.includes('Participant') ||
      n.includes('Registration') ||
      n.includes('Standing') ||
      n.includes('Bracket')
    );
  }),
];

// ─── Hub navigation links ─────────────────────────────────────────────────────

describe('TournamentOperationalHub — navigation links', () => {
  const hubSrc = readFileSync(
    join(ADMIN_ROOT, 'components', 'tournaments', 'TournamentOperationalHub.vue'),
    'utf8',
  );

  it('links to /registrations route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/registrations/);
  });

  it('links to /participants route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/participants/);
  });

  it('links to /matches route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/matches/);
  });

  it('links to /results route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/results/);
  });

  it('links to /standings route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/standings/);
  });

  it('links to /bracket route', () => {
    expect(hubSrc).toMatch(/\/tournaments\/.*\/bracket/);
  });

  it('does not link to /operations route', () => {
    expect(hubSrc).not.toMatch(/\/tournaments\/.*\/operations/);
  });

  it('does not link to /preview route', () => {
    expect(hubSrc).not.toMatch(/\/tournaments\/.*\/preview/);
  });

  it('gates registrations link on TOURNAMENT_REGISTRATION_READ permission', () => {
    expect(hubSrc).toMatch(/canReadRegistrations/);
    expect(hubSrc).toMatch(/TOURNAMENT_REGISTRATION_READ/);
  });

  it('gates participants link on TOURNAMENT_PARTICIPANT_READ permission', () => {
    expect(hubSrc).toMatch(/canReadParticipants/);
    expect(hubSrc).toMatch(/TOURNAMENT_PARTICIPANT_READ/);
  });

  it('gates matches/results/standings/bracket links on TOURNAMENT_MATCH_READ permission', () => {
    expect(hubSrc).toMatch(/canReadMatches/);
    expect(hubSrc).toMatch(/TOURNAMENT_MATCH_READ/);
  });

  it('does not use raw permission strings for navigation gates', () => {
    expect(hubSrc).not.toMatch(/'tournament\.registration\.read'/);
    expect(hubSrc).not.toMatch(/"tournament\.registration\.read"/);
    expect(hubSrc).not.toMatch(/'tournament\.participant\.read'/);
    expect(hubSrc).not.toMatch(/"tournament\.participant\.read"/);
    expect(hubSrc).not.toMatch(/'tournament\.match\.read'/);
    expect(hubSrc).not.toMatch(/"tournament\.match\.read"/);
  });
});

// ─── Route existence ──────────────────────────────────────────────────────────

describe('Slice 10 — all 6 operational route pages exist', () => {
  const routeNames = [
    'registrations',
    'participants',
    'matches',
    'results',
    'standings',
    'bracket',
  ];

  for (const route of routeNames) {
    it(`/tournaments/:id/${route} page file exists`, () => {
      const exists = ALL_TOURNAMENT_PAGES.some((f) =>
        f.replace(/\\/g, '/').includes(`/[id]/${route}`),
      );
      expect(exists).toBe(true);
    });
  }

  it('no tournament page has /admin prefix in its route path', () => {
    for (const file of ALL_TOURNAMENT_PAGES) {
      expect(file.replace(/\\/g, '/')).not.toMatch(/\/pages\/admin\/tournaments\//);
    }
  });
});

// ─── SDK-only access ──────────────────────────────────────────────────────────

describe('operational pages — admin SDK only (no direct fetch/$fetch/axios)', () => {
  const DIRECT_FETCH = /(?<!\.)fetch\s*\(/;

  it('operational pages do not call fetch() directly', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers.`);
      }
    }
  });

  it('operational pages do not use $fetch', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/\$fetch\s*\(/);
    }
  });

  it('operational pages do not import axios', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/from\s+['"]axios['"]/);
    }
  });

  it('operational source files do not call fetch() directly', () => {
    for (const file of OPERATIONAL_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (DIRECT_FETCH.test(src)) {
        throw new Error(`Direct fetch() found in ${file}. Use admin SDK client wrappers.`);
      }
    }
  });

  it('operational pages do not use public SDK for admin workflows', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createTournamentsClient\(/);
    }
  });
});

// ─── Permission constants ─────────────────────────────────────────────────────

describe('operational pages — DragonPermissions constants only', () => {
  const RAW_PERMS = [
    "'tournament.match.read'",
    '"tournament.match.read"',
    "'tournament.result.manage'",
    '"tournament.result.manage"',
    "'tournament.registration.read'",
    '"tournament.registration.read"',
    "'tournament.participant.read'",
    '"tournament.participant.read"',
    "'tournament.registration.manage'",
    '"tournament.registration.manage"',
  ];

  it('operational pages do not use raw permission strings', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      for (const perm of RAW_PERMS) {
        if (src.includes(perm)) {
          throw new Error(
            `Raw permission string '${perm}' found in ${file}. Use DragonPermissions constants.`,
          );
        }
      }
    }
  });

  it('matches/results/standings/bracket pages use TOURNAMENT_MATCH_READ', () => {
    const matchRelatedPages = OPERATIONAL_PAGES.filter((f) => {
      const n = f.replace(/\\/g, '/');
      return (
        n.includes('/matches') ||
        n.includes('/results') ||
        n.includes('/standings') ||
        n.includes('/bracket')
      );
    });
    for (const file of matchRelatedPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_MATCH_READ/);
    }
  });

  it('registrations page uses TOURNAMENT_REGISTRATION_READ', () => {
    const regPages = OPERATIONAL_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('/registrations'),
    );
    for (const file of regPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_REGISTRATION_READ/);
    }
  });

  it('participants page uses TOURNAMENT_PARTICIPANT_READ', () => {
    const partPages = OPERATIONAL_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('/participants'),
    );
    for (const file of partPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/TOURNAMENT_PARTICIPANT_READ/);
    }
  });
});

// ─── No fake operational data ─────────────────────────────────────────────────

describe('operational pages — no fake or hardcoded data', () => {
  const FAKE_PATTERNS = [
    { label: 'fakeMatch', pattern: /\bfakeMatch\s*=\s*\{/ },
    { label: 'mockMatch literal', pattern: /\bmockMatch\s*=\s*\{/ },
    { label: 'fakeParticipant', pattern: /\bfakeParticipant\s*=\s*\{/ },
    { label: 'fakeRegistration', pattern: /\bfakeRegistration\s*=\s*\{/ },
    { label: 'fakeStandings', pattern: /\bfakeStandings\s*=\s*\{/ },
    { label: 'Hardcoded ObjectId', pattern: /507f1f77bcf86cd799439/ },
    { label: 'Team Alpha hardcoded', pattern: /['"]Team Alpha['"]/ },
    { label: 'Player One hardcoded', pattern: /['"]Player One['"]/ },
  ];

  it('operational pages do not contain fake or hardcoded data', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      for (const { label, pattern } of FAKE_PATTERNS) {
        if (pattern.test(src)) {
          throw new Error(`Fake data pattern '${label}' found in ${file}.`);
        }
      }
    }
  });
});

// ─── No hardcoded API domains ─────────────────────────────────────────────────

describe('operational source files — no hardcoded API domains', () => {
  const LOCALHOST_URL = /['"`]https?:\/\/localhost/;
  const QESB_URL = /['"`]https?:\/\/[a-z.]*qesb\.ir/;

  it('operational source files do not hardcode localhost as API origin', () => {
    for (const file of OPERATIONAL_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (LOCALHOST_URL.test(src)) {
        throw new Error(`Hardcoded localhost URL found in ${file}.`);
      }
    }
  });

  it('operational source files do not hardcode qesb.ir as API origin', () => {
    for (const file of OPERATIONAL_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      if (QESB_URL.test(src)) {
        throw new Error(`Hardcoded qesb.ir URL found in ${file}.`);
      }
    }
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('operational pages — scope guardrails (no out-of-scope features)', () => {
  it('no operational page contains bracket editor UI', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/BracketEditor/i);
      expect(src).not.toMatch(/drag.*drop/i);
      expect(src).not.toMatch(/onDragStart|onDrop/);
      expect(src).not.toMatch(/draggable\s*=\s*["']true["']/);
    }
  });

  it('no operational page contains live scoring or WebSocket', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/LiveScoring/i);
      expect(src).not.toMatch(/WebSocket/i);
      expect(src).not.toMatch(/useWebSocket/i);
    }
  });

  it('no operational page references Swiss or double-elimination format UI', () => {
    for (const file of OPERATIONAL_PAGES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/['"`]swiss['"`]/);
      expect(src).not.toMatch(/['"`]double_elimination['"`]/);
    }
  });

  it('standings page does not compute standings client-side as source of truth', () => {
    const standingsPages = OPERATIONAL_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('/standings'),
    );
    for (const file of standingsPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/computeStandings/i);
      expect(src).not.toMatch(/calculatePoints/i);
      expect(src).not.toMatch(/sortByPoints.*\.map/i);
    }
  });

  it('results page does not compute results client-side as source of truth', () => {
    const resultsPages = OPERATIONAL_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('/results'),
    );
    for (const file of resultsPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/computeResults/i);
      expect(src).not.toMatch(/calculateResults/i);
    }
  });

  it('bracket page is read-only (no bracket mutation calls)', () => {
    const bracketPages = OPERATIONAL_PAGES.filter((f) =>
      f.replace(/\\/g, '/').includes('/bracket'),
    );
    for (const file of bracketPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/updateBracket|createBracket|deleteBracket|setBracketNode/i);
    }
  });
});

// ─── Composable usage ─────────────────────────────────────────────────────────

describe('operational pages — correct composable usage', () => {
  it('matches page uses useAdminTournamentMatches', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/matches'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentMatches/);
    }
  });

  it('results page uses useAdminTournamentMatches and useAdminTournamentResults', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/results'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentMatches/);
      expect(src).toMatch(/useAdminTournamentResults/);
    }
  });

  it('standings page uses useAdminTournamentStandings', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/standings'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentStandings/);
    }
  });

  it('bracket page uses useAdminTournamentBracket', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/bracket'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentBracket/);
    }
  });

  it('registrations page uses useAdminTournamentRegistrations', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/registrations'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentRegistrations/);
    }
  });

  it('participants page uses useAdminTournamentParticipants', () => {
    const pages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/participants'));
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentParticipants/);
    }
  });
});

// ─── Participant selection in matches page ────────────────────────────────────

describe('matches page — participant selection via composable', () => {
  const matchesPages = OPERATIONAL_PAGES.filter((f) => f.replace(/\\/g, '/').includes('/matches'));

  it('matches page uses useAdminTournamentParticipants composable', () => {
    for (const file of matchesPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/useAdminTournamentParticipants/);
    }
  });

  it('create match participant fields are select-backed (not free-text input)', () => {
    for (const file of matchesPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/id="create-p1"/);
      expect(src).not.toMatch(/<input[^>]*id="create-p1"/s);
      expect(src).toMatch(/id="create-p2"/);
      expect(src).not.toMatch(/<input[^>]*id="create-p2"/s);
    }
  });

  it('update match participant fields are select-backed (not free-text input)', () => {
    for (const file of matchesPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/id="edit-p1"/);
      expect(src).not.toMatch(/<input[^>]*id="edit-p1"/s);
      expect(src).toMatch(/id="edit-p2"/);
      expect(src).not.toMatch(/<input[^>]*id="edit-p2"/s);
    }
  });

  it('no arbitrary raw participant ID free-text input remains for create/update', () => {
    for (const file of matchesPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/type="text"[^>]*placeholder[^>]*شناسه شرکت‌کننده/s);
      expect(src).not.toMatch(/placeholder[^>]*شناسه شرکت‌کننده[^>]*type="text"/s);
    }
  });

  it('no fake participant options in matches page', () => {
    for (const file of matchesPages) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/fakeParticipant/i);
      expect(src).not.toMatch(/mockParticipant/i);
      expect(src).not.toMatch(/['"]Player One['"]/);
      expect(src).not.toMatch(/['"]Team Alpha['"]/);
    }
  });
});

// ─── No separate bracket SDK client ──────────────────────────────────────────

describe('bracket SDK design guardrail', () => {
  it('no createAdminTournamentBracketClient factory is used in operational source files', () => {
    for (const file of OPERATIONAL_SOURCE_FILES) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/createAdminTournamentBracketClient/);
    }
  });

  it('bracket feature file uses createAdminTournamentsClient for getBracket', () => {
    const bracketApiFile = join(
      ADMIN_ROOT,
      'features',
      'tournaments',
      'admin-tournament-bracket.api.ts',
    );
    const src = readFileSync(bracketApiFile, 'utf8');
    expect(src).toMatch(/createAdminTournamentsClient/);
    expect(src).toMatch(/getBracket/);
  });
});
