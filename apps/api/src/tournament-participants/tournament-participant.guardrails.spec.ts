/**
 * Task 6.2 guardrails — Tournament participant domain.
 *
 * Permanent guardrails (never remove):
 *   - Participants are derived projections — no separate TournamentParticipant schema
 *   - No independent Team, Club, or Organization model
 *   - No match/result/standing/bracket references in participant code
 *   - No payment/prize/shop fields
 *   - No hardcoded localhost or qesb.ir in runtime code
 *   - No fake/seed participant data
 *   - Public projection must not expose userId, phone, email, or contact data
 *   - Participant statuses: active | withdrawn | disqualified | removed only (not eliminated)
 *   - Remove/disqualify are explicit service methods (no generic status patch)
 *   - No frontend /tournaments/:id/participants route in backend code
 *   - No frontend /tournaments/:id/registrations route in backend code
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const DIR = join(__dirname);
const ADMIN_DIR = join(__dirname, '../admin/tournament-participants');

function read(file: string): string {
  return readFileSync(join(DIR, file), 'utf8');
}

function readAdmin(file: string): string {
  return readFileSync(join(ADMIN_DIR, file), 'utf8');
}

// ─── Implementation choice: derived projection, no separate schema ─────────────

describe('participant implementation choice — derived projection', () => {
  it('no TournamentParticipant schema file exists (participants are derived)', () => {
    expect(existsSync(join(DIR, 'tournament-participant.schema.ts'))).toBe(false);
  });

  it('no tournament_participants collection reference in participant service', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toContain("collection: 'tournament_participants'");
  });

  it('participant service injects TournamentRegistration model (derivation source)', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('TournamentRegistration');
  });

  it('policy file documents derivation choice', () => {
    const src = read('tournament-participant-policy.ts');
    expect(src).toContain('derived');
    // Case-insensitive check for "no separate" or "No separate"
    expect(src.toLowerCase()).toContain('no separate');
  });
});

// ─── Permanent: no independent Team/Club/Organization schema ─────────────────

describe('permanent guardrail — no independent Team, Club, or Organization schema', () => {
  it('no team schema file exists', () => {
    expect(existsSync(join(DIR, 'team.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, '../teams/team.schema.ts'))).toBe(false);
  });

  it('no club schema file exists', () => {
    expect(existsSync(join(DIR, 'club.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, '../clubs/club.schema.ts'))).toBe(false);
  });

  it('no organization schema file exists', () => {
    expect(existsSync(join(DIR, 'organization.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, '../organizations/organization.schema.ts'))).toBe(false);
  });
});

// ─── Participant status values ─────────────────────────────────────────────────

describe('participant status — locked values only', () => {
  it('policy uses only locked statuses: active, withdrawn, disqualified, removed', () => {
    const src = read('tournament-participant-policy.ts');
    expect(src).toContain("'active'");
    expect(src).toContain("'withdrawn'");
    expect(src).toContain("'disqualified'");
    expect(src).toContain("'removed'");
  });

  it('policy does not use eliminated as a return value or string literal', () => {
    const src = read('tournament-participant-policy.ts');
    // 'eliminated' may appear in comments documenting its exclusion, but must
    // not appear as a return value or string literal in code.
    expect(src).not.toMatch(/return\s+['"]eliminated['"]/);
    expect(src).not.toMatch(/status\s*(?:===|!==|:)\s*['"]eliminated['"]/);
  });

  it('service does not reference eliminated status', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toContain('eliminated');
  });
});

// ─── Permanent: no match/result/standing/bracket ─────────────────────────────

describe('permanent guardrail — no match/result/standing/bracket in participant code', () => {
  it('participant service has no match/bracket/standing references', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toMatch(/match|Match|bracket|Bracket|standing|Standing/);
  });

  it('participant policy has no match/bracket/standing references', () => {
    const src = read('tournament-participant-policy.ts');
    expect(src).not.toMatch(/match|Match|bracket|Bracket|standing|Standing/);
  });

  it('admin participant controller has no match/bracket/standing service or model references', () => {
    // Excludes: Patch decorator (HTTP method), HttpStatus (NestJS enum).
    // Targets: actual match/bracket/standing feature classes.
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).not.toMatch(/MatchService|MatchRepository|MatchModel/);
    expect(src).not.toMatch(/BracketService|BracketRepository|BracketModel/);
    expect(src).not.toMatch(/StandingService|StandingRepository|StandingModel/);
  });
});

// ─── Permanent: no payment/prize/shop ────────────────────────────────────────

describe('permanent guardrail — no payment, prize, or shop fields', () => {
  it('participant service has no payment/prize/shop references', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('participant projection has no payment/prize/shop references', () => {
    const src = read('tournament-participant-projection.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── Public projection privacy ────────────────────────────────────────────────

describe('public projection privacy — no sensitive data leakage', () => {
  it('toParticipantPublicDto does not include userId', () => {
    const src = read('tournament-participant-projection.ts');
    // The public DTO function body should not set userId.
    const publicFnMatch = src.match(/export function toParticipantPublicDto[\s\S]*?^}/m);
    const publicFnBlock = publicFnMatch?.[0] ?? '';
    expect(publicFnBlock).not.toContain('userId:');
  });

  it('projection has no phone/email/contact field assignments in output DTOs', () => {
    // Comments may mention these as excluded fields; check that no assignment appears.
    const src = read('tournament-participant-projection.ts');
    expect(src).not.toMatch(/(?:phone|email|contact)\s*:/i);
  });

  it('projection does not map rejectedReason to output DTO', () => {
    // The comment documents exclusion; check that no assignment appears.
    const src = read('tournament-participant-projection.ts');
    expect(src).not.toMatch(/rejectedReason\s*:/);
  });

  it('projection does not expose internal timestamps (participantRemovedAt/participantDisqualifiedAt)', () => {
    const src = read('tournament-participant-projection.ts');
    expect(src).not.toContain('participantRemovedAt:');
    expect(src).not.toContain('participantDisqualifiedAt:');
  });
});

// ─── Explicit remove/disqualify actions ──────────────────────────────────────

describe('explicit admin actions — remove and disqualify', () => {
  it('service exposes removeParticipant method', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('removeParticipant');
  });

  it('service exposes disqualifyParticipant method', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('disqualifyParticipant');
  });

  it('admin controller has /remove endpoint', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('/remove');
  });

  it('admin controller has /disqualify endpoint', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('/disqualify');
  });

  it('PATCH body parser rejects status field', () => {
    const src = read('dto/participant-body.ts');
    expect(src).not.toContain("'status'");
    // KNOWN_UPDATE_FIELDS should only contain seed and displayName
    expect(src).toContain("'seed'");
    expect(src).toContain("'displayName'");
  });
});

// ─── Permission protection ────────────────────────────────────────────────────

describe('admin participant controller — permission protection', () => {
  it('controller uses AccessTokenGuard', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('AccessTokenGuard');
  });

  it('controller uses PermissionGuard', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('PermissionGuard');
  });

  it('list uses TOURNAMENT_PARTICIPANT_READ permission', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('TOURNAMENT_PARTICIPANT_READ');
  });

  it('update uses TOURNAMENT_PARTICIPANT_MANAGE permission', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('TOURNAMENT_PARTICIPANT_MANAGE');
  });

  it('remove uses TOURNAMENT_PARTICIPANT_MANAGE permission', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('TOURNAMENT_PARTICIPANT_MANAGE');
  });

  it('disqualify uses TOURNAMENT_PARTICIPANT_MANAGE permission', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('TOURNAMENT_PARTICIPANT_MANAGE');
  });

  it('controller uses centralized Permissions constants (not raw strings)', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).toContain('Permissions.');
    expect(src).not.toMatch(/'tournament\.participant\.(read|manage)'/);
  });
});

// ─── Permanent: no hardcoded origins ─────────────────────────────────────────

describe('permanent guardrail — no hardcoded localhost or qesb.ir', () => {
  it('participant service has no hardcoded origin', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('participant policy has no hardcoded origin', () => {
    const src = read('tournament-participant-policy.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('participant projection has no hardcoded origin', () => {
    const src = read('tournament-participant-projection.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('admin participant controller has no hardcoded origin', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── Permanent: no fake participants ─────────────────────────────────────────

describe('permanent guardrail — no fake or seed participant data', () => {
  it('participant service has no fake data', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).not.toMatch(/fake|FAKE|seed.*Dragon|Dragon.*Cup/);
  });

  it('no participant seed file exists', () => {
    expect(existsSync(join(DIR, 'participant-seed.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'seeds'))).toBe(false);
  });
});

// ─── No frontend route references ────────────────────────────────────────────

describe('permanent guardrail — no frontend route references', () => {
  it('admin controller has no /tournaments/:id/participants frontend route string', () => {
    const src = readAdmin('admin-tournament-participants.controller.ts');
    // Backend paths like admin/v1/... are fine; frontend-style paths are not.
    expect(src).not.toMatch(/\/tournaments\/.*\/participants.*page/i);
    expect(src).not.toMatch(/frontend|nuxt|vue/i);
  });
});

// ─── Module structure ─────────────────────────────────────────────────────────

describe('tournament-participants module structure', () => {
  it('module file exists', () => {
    expect(existsSync(join(DIR, 'tournament-participants.module.ts'))).toBe(true);
  });

  it('module exports TournamentParticipantService', () => {
    const src = read('tournament-participants.module.ts');
    expect(src).toContain('TournamentParticipantService');
    expect(src).toContain('exports:');
  });

  it('admin module file exists', () => {
    expect(existsSync(join(ADMIN_DIR, 'admin-tournament-participants.module.ts'))).toBe(true);
  });

  it('admin module registers AdminTournamentParticipantsController', () => {
    const src = readAdmin('admin-tournament-participants.module.ts');
    expect(src).toContain('AdminTournamentParticipantsController');
    expect(src).toContain('controllers:');
  });
});

// ─── Audit hooks ─────────────────────────────────────────────────────────────

describe('audit hooks in participant service', () => {
  it('service uses PARTICIPANT_REMOVED audit action', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('PARTICIPANT_REMOVED');
  });

  it('service uses PARTICIPANT_DISQUALIFIED audit action', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('PARTICIPANT_DISQUALIFIED');
  });

  it('audit calls are fire-and-forget (void)', () => {
    const src = read('tournament-participant.service.ts');
    expect(src).toContain('void this.auditService?.log');
  });
});
