/**
 * Slice 6 closeout hardening — Registration and Participant domain.
 *
 * Permanent guardrails (never remove):
 *   - No bracket schema/model/collection exists in the API
 *   - No Swiss or Double Elimination format in tournament schema
 *   - No advanced bracket editor model
 *   - Admin controllers use centralized Permissions.* constants (no raw strings)
 *   - Analytics event name is exactly tournament.registration_completed
 *   - Audit actions are used for all registration state changes
 *   - No admin /operations or /preview standalone routes
 *   - Registration notifications are deferred (Slice 11) — no marketing/push
 *   - No fake/seed registration or participant data
 *
 * Temporary Slice-6 checks (clearly labeled — remove when feature slice lands):
 *   - No public controller for /api/v1/tournaments/:slug/participants   → remove when participant public API lands
 *   - No public controller for /api/v1/tournaments/:slug/matches        → remove when match public API lands
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const API_SRC = join(__dirname, '..');
const REGISTRATION_DIR = join(__dirname);
const PARTICIPANT_DIR = join(__dirname, '../tournament-participants');
const TOURNAMENT_DIR = join(__dirname, '../tournaments');
const ADMIN_TOURNAMENT_DIR = join(__dirname, '../admin/tournaments');
const ADMIN_REGISTRATION_DIR = join(__dirname, '../admin/tournament-registrations');
const ADMIN_PARTICIPANT_DIR = join(__dirname, '../admin/tournament-participants');

function read(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

// ─── PERMANENT: No bracket schema/model/collection in API src ─────────────────

describe('PERMANENT — no bracket collection or model', () => {
  it('no bracket.schema.ts file exists in API src', () => {
    expect(existsSync(join(API_SRC, 'brackets', 'bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(API_SRC, 'tournament-brackets', 'bracket.schema.ts'))).toBe(false);
  });

  it('no tournament-brackets directory exists', () => {
    expect(existsSync(join(API_SRC, 'tournament-brackets'))).toBe(false);
  });

  it('no bracket model file in tournament-registrations dir', () => {
    expect(existsSync(join(REGISTRATION_DIR, 'bracket.schema.ts'))).toBe(false);
  });

  it('no bracket model file in tournament-participants dir', () => {
    expect(existsSync(join(PARTICIPANT_DIR, 'bracket.schema.ts'))).toBe(false);
  });

  it('tournament schema formats array does not include swiss', () => {
    const src = read(join(TOURNAMENT_DIR, 'tournament.schema.ts'));
    expect(src).not.toContain("'swiss'");
    expect(src).not.toContain('"swiss"');
  });

  it('tournament schema formats array does not include double_elimination', () => {
    const src = read(join(TOURNAMENT_DIR, 'tournament.schema.ts'));
    expect(src).not.toContain("'double_elimination'");
    expect(src).not.toContain('"double_elimination"');
  });

  it('tournament schema formats are limited to single_elimination, round_robin, manual', () => {
    const src = read(join(TOURNAMENT_DIR, 'tournament.schema.ts'));
    expect(src).toContain('single_elimination');
    expect(src).toContain('round_robin');
    expect(src).toContain('manual');
  });
});

// ─── PERMANENT: No match/result/standing in registration/participant scope ────

describe('PERMANENT — no match/result/standing in Slice 6 scope', () => {
  it('registration service has no match/bracket/standing references', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/MatchService|MatchRepository|MatchModel/);
    expect(src).not.toMatch(/BracketService|BracketRepository|BracketModel/);
    expect(src).not.toMatch(/StandingService|StandingRepository|StandingModel/);
  });

  it('participant policy has no match/bracket/standing references', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant-policy.ts'));
    expect(src).not.toMatch(/match|Match|bracket|Bracket|standing|Standing/);
  });
});

// ─── PERMANENT: Admin controllers use centralized Permissions.* constants ─────

describe('PERMANENT — no raw permission strings in admin controllers', () => {
  it('admin registration controller uses Permissions.* (not raw strings)', () => {
    const src = read(join(ADMIN_REGISTRATION_DIR, 'admin-tournament-registrations.controller.ts'));
    expect(src).toContain('Permissions.');
    expect(src).not.toMatch(/'tournament\.registration\.(read|manage)'/);
    expect(src).not.toMatch(/"tournament\.registration\.(read|manage)"/);
  });

  it('admin participant controller uses Permissions.* (not raw strings)', () => {
    const src = read(join(ADMIN_PARTICIPANT_DIR, 'admin-tournament-participants.controller.ts'));
    expect(src).toContain('Permissions.');
    expect(src).not.toMatch(/'tournament\.participant\.(read|manage)'/);
    expect(src).not.toMatch(/"tournament\.participant\.(read|manage)"/);
  });

  it('admin tournament controller uses Permissions.* (not raw strings)', () => {
    const src = read(join(ADMIN_TOURNAMENT_DIR, 'admin-tournaments.controller.ts'));
    expect(src).toContain('Permissions.');
    expect(src).not.toMatch(/'tournament\.(read|create|update|publish|cancel|archive)'/);
  });
});

// ─── PERMANENT: Analytics event names are exact ───────────────────────────────

describe('PERMANENT — analytics event names exact in registration service', () => {
  it('service uses exactly tournament.registration_completed', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain("'tournament.registration_completed'");
  });

  it('service does not use registration_completed (missing namespace)', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/'registration_completed'/);
    expect(src).not.toMatch(/'tournament_registration_completed'/);
  });

  it('service does not use registrationCompleted (camelCase variant)', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/'registrationCompleted'/);
    expect(src).not.toMatch(/'tournamentRegistrationCompleted'/);
  });
});

// ─── PERMANENT: Audit actions cover all registration state changes ────────────

describe('PERMANENT — audit actions for registration lifecycle', () => {
  it('service references REGISTRATION_SUBMITTED audit action', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('REGISTRATION_SUBMITTED');
  });

  it('service references REGISTRATION_APPROVED audit action', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('REGISTRATION_APPROVED');
  });

  it('service references REGISTRATION_REJECTED audit action', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('REGISTRATION_REJECTED');
  });

  it('service references REGISTRATION_WITHDRAWN audit action', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('REGISTRATION_WITHDRAWN');
  });

  it('service references REGISTRATION_CANCELLED audit action', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('REGISTRATION_CANCELLED');
  });

  it('audit calls are fire-and-forget (void)', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('void this.auditService?.log');
  });
});

// ─── PERMANENT: Notifications are deferred — no marketing/push/campaign ───────

describe('PERMANENT — notification scope is deferred and limited', () => {
  it('registration service has no push notification references', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/pushNotif|PushNotif|fcm|apns/i);
  });

  it('registration service has no marketing or campaign references', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/campaign|marketing|broadcast/i);
  });

  it('registration service defers notifications to Slice 11 (stub comment present)', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).toContain('Slice 11');
  });
});

// ─── PERMANENT: No admin operations/preview standalone routes ─────────────────

describe('PERMANENT — no standalone operations or preview admin routes', () => {
  it('admin tournament controller has no /operations endpoint', () => {
    const src = read(join(ADMIN_TOURNAMENT_DIR, 'admin-tournaments.controller.ts'));
    expect(src).not.toContain("'/operations'");
    expect(src).not.toContain("'/:id/operations'");
    expect(src).not.toContain("':id/operations'");
  });

  it('admin tournament controller has no /preview endpoint', () => {
    const src = read(join(ADMIN_TOURNAMENT_DIR, 'admin-tournaments.controller.ts'));
    expect(src).not.toContain("'/preview'");
    expect(src).not.toContain("'/:id/preview'");
    expect(src).not.toContain("':id/preview'");
  });
});

// ─── PERMANENT: Re-registration policy — withdrawn/cancelled allow, rejected blocks ──

describe('PERMANENT — re-registration policy documented in source', () => {
  it('policy source documents that withdrawn allows re-registration', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration-policy.ts'));
    expect(src).toContain('withdrawn');
    // The source explicitly lists withdrawn as allowing re-registration.
    expect(src).not.toMatch(/withdrawn.*block/i);
  });

  it('policy source documents that cancelled allows re-registration', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration-policy.ts'));
    expect(src).toContain('cancelled');
  });

  it('policy source documents that rejected blocks re-registration (conservative default)', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration-policy.ts'));
    expect(src).toContain('rejected');
    expect(src).toContain('conservative');
  });
});

// ─── PERMANENT: No fake/seed registration or participant data ─────────────────

describe('PERMANENT — no fake or seed data', () => {
  it('registration service has no fake data', () => {
    const src = read(join(REGISTRATION_DIR, 'tournament-registration.service.ts'));
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('participant service has no fake data', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant.service.ts'));
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });

  it('no participant seed file exists', () => {
    expect(existsSync(join(PARTICIPANT_DIR, 'participant-seed.ts'))).toBe(false);
    expect(existsSync(join(PARTICIPANT_DIR, 'seeds'))).toBe(false);
  });

  it('no registration seed file exists', () => {
    expect(existsSync(join(REGISTRATION_DIR, 'registration-seed.ts'))).toBe(false);
    expect(existsSync(join(REGISTRATION_DIR, 'seeds'))).toBe(false);
  });
});

// ─── PERMANENT: Participant implementation — derived projection ────────────────

describe('PERMANENT — participant is a derived projection (no separate schema)', () => {
  it('participant policy documents derivation choice', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant-policy.ts'));
    expect(src).toContain('derived');
    expect(src.toLowerCase()).toContain('no separate');
  });

  it('no TournamentParticipant schema file exists', () => {
    expect(existsSync(join(PARTICIPANT_DIR, 'tournament-participant.schema.ts'))).toBe(false);
  });

  it('participant service injects TournamentRegistration model as derivation source', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant.service.ts'));
    expect(src).toContain('TournamentRegistration');
  });
});

// ─── PERMANENT: Participant statuses use only locked values ───────────────────

describe('PERMANENT — locked participant statuses only', () => {
  it('participant policy uses only active, withdrawn, disqualified, removed', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant-policy.ts'));
    expect(src).toContain("'active'");
    expect(src).toContain("'withdrawn'");
    expect(src).toContain("'disqualified'");
    expect(src).toContain("'removed'");
  });

  it('participant policy does not return eliminated as a status value', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant-policy.ts'));
    expect(src).not.toMatch(/return\s+['"]eliminated['"]/);
    expect(src).not.toMatch(/status\s*(?:===|!==|:)\s*['"]eliminated['"]/);
  });

  it('participant service does not reference eliminated status', () => {
    const src = read(join(PARTICIPANT_DIR, 'tournament-participant.service.ts'));
    expect(src).not.toContain('eliminated');
  });
});

// ─── PERMANENT: No hardcoded origins in registration/participant code ──────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in Slice 6 source', () => {
  const filesToCheck = [
    join(REGISTRATION_DIR, 'tournament-registration.service.ts'),
    join(REGISTRATION_DIR, 'tournament-registration-policy.ts'),
    join(REGISTRATION_DIR, 'tournament-registration.repository.ts'),
    join(PARTICIPANT_DIR, 'tournament-participant.service.ts'),
    join(PARTICIPANT_DIR, 'tournament-participant-policy.ts'),
    join(PARTICIPANT_DIR, 'tournament-participant-projection.ts'),
    join(ADMIN_REGISTRATION_DIR, 'admin-tournament-registrations.controller.ts'),
    join(ADMIN_PARTICIPANT_DIR, 'admin-tournament-participants.controller.ts'),
  ];

  for (const filePath of filesToCheck) {
    const label = filePath.split('/').slice(-2).join('/');
    it(`${label} has no hardcoded localhost or qesb.ir`, () => {
      const src = read(filePath);
      expect(src).not.toMatch(/localhost/);
      expect(src).not.toMatch(/qesb\.ir/);
    });
  }
});

// ─── TEMPORARY: Public operational routes not yet implemented ─────────────────
//
// These checks verify that public operational routes for tournaments have not
// been accidentally created in Slice 6. Remove each check when the
// corresponding route is added in a future slice.

describe('TEMPORARY — Slice-6 public operational route preconditions', () => {
  // TEMPORARY: remove when public participant listing API lands.
  it('TEMPORARY — no public-participants controller in tournament-participants dir', () => {
    expect(existsSync(join(PARTICIPANT_DIR, 'public-tournament-participants.controller.ts'))).toBe(
      false,
    );
    expect(existsSync(join(PARTICIPANT_DIR, 'tournament-participants.controller.ts'))).toBe(false);
  });

  // TEMPORARY: remove when public match listing API lands.
  it('TEMPORARY — no tournament-matches directory exists', () => {
    expect(existsSync(join(API_SRC, 'tournament-matches'))).toBe(false);
  });

  // TEMPORARY: remove when results API lands.
  it('TEMPORARY — no tournament-results directory exists', () => {
    expect(existsSync(join(API_SRC, 'tournament-results'))).toBe(false);
  });

  // TEMPORARY: remove when standings API lands.
  it('TEMPORARY — no tournament-standings directory exists', () => {
    expect(existsSync(join(API_SRC, 'tournament-standings'))).toBe(false);
  });
});
