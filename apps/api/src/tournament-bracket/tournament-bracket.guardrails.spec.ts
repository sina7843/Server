/**
 * Task 7.3 guardrails — Tournament Bracket backend domain.
 *
 * Permanent guardrails (never remove):
 *   - No TournamentBracket collection / schema / model
 *   - No bracket persistence model
 *   - No independent bracket nodes stored separately from matches
 *   - No editable bracket state
 *   - Bracket is projected from TournamentMatch records
 *   - No Swiss / Double Elimination logic
 *   - No live scoring / WebSocket
 *   - No public result detail / match detail route
 *   - No hardcoded localhost or qesb.ir
 *   - Admin controller uses Permissions.TOURNAMENT_MATCH_READ
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const BRACKET_DIR = join(__dirname);
const ADMIN_BRACKET_DIR = join(__dirname, '../admin/tournament-bracket');

function read(file: string): string {
  return readFileSync(join(BRACKET_DIR, file), 'utf8');
}

function readAdmin(file: string): string {
  return readFileSync(join(ADMIN_BRACKET_DIR, file), 'utf8');
}

// ─── Required files exist ─────────────────────────────────────────────────────

describe('required bracket domain files exist', () => {
  it('tournament-bracket.service.ts exists', () => {
    expect(existsSync(join(BRACKET_DIR, 'tournament-bracket.service.ts'))).toBe(true);
  });

  it('tournament-bracket.module.ts exists', () => {
    expect(existsSync(join(BRACKET_DIR, 'tournament-bracket.module.ts'))).toBe(true);
  });

  it('public-tournament-bracket.controller.ts exists', () => {
    expect(existsSync(join(BRACKET_DIR, 'public-tournament-bracket.controller.ts'))).toBe(true);
  });

  it('admin-tournament-bracket.controller.ts exists', () => {
    expect(existsSync(join(ADMIN_BRACKET_DIR, 'admin-tournament-bracket.controller.ts'))).toBe(
      true,
    );
  });
});

// ─── PERMANENT: No TournamentBracket collection ───────────────────────────────

describe('PERMANENT — no TournamentBracket collection or schema', () => {
  it('no tournament-bracket schema file exists', () => {
    expect(existsSync(join(BRACKET_DIR, 'tournament-bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(BRACKET_DIR, 'bracket.schema.ts'))).toBe(false);
  });

  it('bracket service does not inject a TournamentBracket model', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/@InjectModel\(['"]TournamentBracket/);
  });

  it('bracket service operates on TournamentMatchRepository', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).toContain('TournamentMatchRepository');
  });
});

// ─── PERMANENT: No editable bracket state ────────────────────────────────────

describe('PERMANENT — no editable bracket state', () => {
  it('bracket service has no edit/override/create/save bracket methods', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/editBracket|overrideBracket|saveBracket|createBracketNode/);
  });

  it('admin bracket controller has only GET endpoint (no POST/PATCH/DELETE)', () => {
    const src = readAdmin('admin-tournament-bracket.controller.ts');
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });
});

// ─── PERMANENT: Projection from matches ───────────────────────────────────────

describe('PERMANENT — bracket is projected from TournamentMatch records', () => {
  it('service comment documents projection approach', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src.toLowerCase()).toMatch(/project/);
  });

  it('bracket rounds are grouped from match records', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).toContain('matchRepository');
    expect(src).toContain('round');
  });
});

// ─── PERMANENT: Round grouping and labels ────────────────────────────────────

describe('PERMANENT — round grouping and label logic documented', () => {
  it('single_elimination labels Final, Semifinal, Quarterfinal', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).toContain('Final');
    expect(src).toContain('Semifinal');
    expect(src).toContain('Quarterfinal');
  });

  it('round_robin and manual use Round N labels', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).toContain('Round');
  });
});

// ─── PERMANENT: No Swiss / Double Elimination ────────────────────────────────

describe('PERMANENT — no Swiss or Double Elimination logic', () => {
  it('bracket service has no Swiss implementation', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/swiss|Swiss/);
  });

  it('bracket service has no Double Elimination', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/doubleElim|double_elim|DoubleElimination/i);
  });
});

// ─── PERMANENT: No live scoring / WebSocket ───────────────────────────────────

describe('PERMANENT — no live scoring or WebSocket in bracket domain', () => {
  it('bracket service has no WebSocket or live score references', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/WebSocket|Socket\.io|liveScore|scoreEvent|@WebSocketGateway/);
  });
});

// ─── PERMANENT: No fake bracket data ─────────────────────────────────────────

describe('PERMANENT — no fake bracket data', () => {
  it('bracket service has no fake data', () => {
    const src = read('tournament-bracket.service.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });
});

// ─── PERMANENT: Admin controller permissions ──────────────────────────────────

describe('PERMANENT — admin bracket controller uses correct permissions', () => {
  it('GET bracket uses Permissions.TOURNAMENT_MATCH_READ', () => {
    const src = readAdmin('admin-tournament-bracket.controller.ts');
    expect(src).toContain('Permissions.TOURNAMENT_MATCH_READ');
    expect(src).not.toMatch(/'tournament\.match\.read'/);
  });

  it('admin controller does not define a public-facing route', () => {
    const src = readAdmin('admin-tournament-bracket.controller.ts');
    expect(src).not.toMatch(/@Controller\(['"]api\/v1/);
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in bracket domain', () => {
  const files = [
    'tournament-bracket.service.ts',
    'tournament-bracket.module.ts',
    'public-tournament-bracket.controller.ts',
  ];

  for (const file of files) {
    it(`${file} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(file);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }

  it('admin-tournament-bracket.controller.ts has no hardcoded origins', () => {
    const src = readAdmin('admin-tournament-bracket.controller.ts');
    expect(src).not.toMatch(/localhost/);
    expect(src).not.toMatch(/qesb\.ir/);
  });
});
