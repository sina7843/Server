/**
 * Slice 5 guardrails — Admin tournaments API layer.
 *
 * Permanent guardrails (never remove):
 *   - No registration/participants/matches/results/standings/bracket in Slice 5 scope
 *   - No public tournament controller
 *   - Lifecycle bypass prevention in body parsers
 *   - No prize/payment/shop/streaming in admin tournament source
 *   - No hardcoded localhost or qesb.ir in admin tournament source
 *   - No fake/seed tournament data in admin tournament source
 *
 * Slice-5 temporary guardrails (remove when feature lands):
 *   - No future operation sub-routes implemented yet (registrations, participants, matches, etc.)
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const ADMIN_TOURNAMENT_DIR = join(__dirname);
const TOURNAMENT_DIR = join(__dirname, '..', '..', 'tournaments');

function readSrc(file: string): string {
  return readFileSync(file, 'utf8');
}

function readAdminTournament(file: string): string {
  return readFileSync(join(ADMIN_TOURNAMENT_DIR, file), 'utf8');
}

// ─── Permanent: no forbidden scope in admin tournament controller ─────────────

describe('permanent — admin tournament controller scope', () => {
  it('admin tournament controller source has no registration CRUD endpoints (getRegistrations, createRegistration, deleteRegistration)', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(
      /getRegistrations|createRegistration|deleteRegistration|listRegistrations/i,
    );
  });

  it('admin tournament controller source has no participant CRUD endpoints', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/addParticipant|removeParticipant|listParticipants|getParticipants/i);
  });

  it('admin tournament controller source has no match generation or match management endpoints', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/generateMatch|matchManage|getMatches|updateMatch/i);
  });

  it('admin tournament controller source has no standings endpoints', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/getStandings|standings|StandingsController/i);
  });

  it('admin tournament controller source has no result entry endpoints', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/resultEntry|enterResult|submitResult|updateResult/i);
  });

  it('admin tournament controller source has no bracket references', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('admin tournament controller source has no prize/payment/shop/streaming fields', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('admin tournament module has no participant/match/bracket imports (Slice 11: TournamentRegistrationsModule allowed for notification wiring)', () => {
    const src = readAdminTournament('admin-tournaments.module.ts');
    expect(src).not.toMatch(/Participant|Match|Bracket/);
  });
});

// ─── Permanent: no public tournament controller ───────────────────────────────

describe('permanent — no public tournament controller in Slice 5', () => {
  it('no public-tournaments.controller.ts exists', () => {
    expect(existsSync(join(TOURNAMENT_DIR, 'public-tournaments.controller.ts'))).toBe(false);
  });

  it('no tournament.controller.ts exists in core tournaments dir (admin controller is in admin/)', () => {
    expect(existsSync(join(TOURNAMENT_DIR, 'tournament.controller.ts'))).toBe(false);
  });
});

// ─── Permanent: no hardcoded domains in admin tournament source ───────────────

describe('permanent — no hardcoded localhost or qesb.ir in admin tournament source', () => {
  const files = [
    'admin-tournaments.controller.ts',
    'admin-tournaments.module.ts',
    join('dto', 'admin-tournament-body.ts'),
    join('dto', 'admin-tournament-response.ts'),
  ];

  for (const file of files) {
    it(`${file} has no hardcoded localhost or qesb.ir`, () => {
      const src = readSrc(join(ADMIN_TOURNAMENT_DIR, file));
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }
});

// ─── Permanent: no fake/seed tournament data in admin tournament source ───────

describe('permanent — no fake or seed data in admin tournament source', () => {
  it('admin tournament controller has no fake tournament data', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seed|SEED/);
  });

  it('body parser has no fake tournament data', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seed|SEED/);
  });
});

// ─── Permanent: lifecycle bypass prevention source check ─────────────────────

describe('permanent — lifecycle bypass prevention in body parser source', () => {
  it('body parser source defines LIFECYCLE_BLOCKED_FIELDS set', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain('LIFECYCLE_BLOCKED_FIELDS');
  });

  it('body parser source blocks status field', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain("'status'");
  });

  it('body parser source blocks publishedAt field', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain("'publishedAt'");
  });

  it('body parser source blocks cancelledAt field', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain("'cancelledAt'");
  });

  it('body parser source blocks archivedAt field', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain("'archivedAt'");
  });

  it('body parser source blocks deletedAt field', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain("'deletedAt'");
  });

  it('body parser throws when lifecycle field is detected', () => {
    const src = readSrc(join(ADMIN_TOURNAMENT_DIR, 'dto', 'admin-tournament-body.ts'));
    expect(src).toContain('lifecycle endpoints');
  });
});

// ─── Permanent: lifecycle actions use explicit endpoints ─────────────────────

describe('permanent — lifecycle actions use explicit dedicated endpoints', () => {
  it('controller defines publish endpoint at /:id/publish', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/publish'");
  });

  it('controller defines open-registration endpoint at /:id/open-registration', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/open-registration'");
  });

  it('controller defines close-registration endpoint at /:id/close-registration', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/close-registration'");
  });

  it('controller defines start endpoint at /:id/start', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/start'");
  });

  it('controller defines complete endpoint at /:id/complete', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/complete'");
  });

  it('controller defines cancel endpoint at /:id/cancel', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/cancel'");
  });

  it('controller defines archive endpoint at /:id/archive', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain("':id/archive'");
  });

  it('lifecycle methods call transition() not update() for status changes', () => {
    const src = readAdminTournament('admin-tournaments.controller.ts');
    expect(src).toContain('this.tournamentService.transition(');
  });
});
