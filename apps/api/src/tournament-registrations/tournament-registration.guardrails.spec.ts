/**
 * Slice 6 guardrails — Tournament registration domain.
 *
 * Permanent guardrails (never remove):
 *   - No independent Team, Club, or Organization model
 *   - No participants, matches, results, standings, or bracket implementation
 *   - No payment, prize, or shop fields
 *   - No hardcoded localhost or qesb.ir in runtime registration source
 *   - No fake/seed registration data
 *   - Team data is embedded — no separate collection
 *   - No phone/email in team member data
 *   - Public update cannot change status (UpdateRegistrationInput has no status field)
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const DIR = join(__dirname);

function read(file: string): string {
  return readFileSync(join(DIR, file), 'utf8');
}

// ─── Schema field coverage ────────────────────────────────────────────────────

describe('registration schema — field coverage', () => {
  it('schema declares tournamentId, userId, type, status, submittedAt', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('declare tournamentId');
    expect(src).toContain('declare userId');
    expect(src).toContain('declare type');
    expect(src).toContain('declare status');
    expect(src).toContain('declare submittedAt');
  });

  it('schema declares team data fields: teamName and members', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('declare teamName');
    expect(src).toContain('declare members');
  });

  it('schema declares lifecycle timestamps', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('declare approvedAt');
    expect(src).toContain('declare rejectedAt');
    expect(src).toContain('declare withdrawnAt');
    expect(src).toContain('declare cancelledAt');
  });

  it('schema uses collection name "tournament_registrations"', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain("collection: 'tournament_registrations'");
  });

  it('schema enables mongoose timestamps', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('timestamps: true');
  });
});

// ─── Permanent: no independent Team/Club/Organization model ──────────────────

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

  it('team data is embedded in TournamentRegistration (no separate Team model)', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('RegistrationMember');
    expect(src).not.toContain('TeamSchema');
    expect(src).not.toContain("collection: 'teams'");
  });
});

// ─── Permanent: no participants, matches, results, bracket ───────────────────

describe('permanent guardrail — no participants, matches, results, or bracket', () => {
  it('no participant schema file exists in registration dir', () => {
    expect(existsSync(join(DIR, 'participant.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'tournament-participant.schema.ts'))).toBe(false);
  });

  it('no match schema file exists in registration dir', () => {
    expect(existsSync(join(DIR, 'match.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'tournament-match.schema.ts'))).toBe(false);
  });

  it('registration service has no Participant model, match, bracket, or standing references', () => {
    const src = read('tournament-registration.service.ts');
    // Excludes: participantType (tournament field) and assertParticipantTypeCompatible (policy fn).
    // Targets: separate Participant model, match/bracket/standing features.
    expect(src).not.toMatch(/ParticipantService|ParticipantModel|ParticipantRepository/);
    expect(src).not.toMatch(/match|Match|bracket|Bracket|standing|Standing/);
  });

  it('registration schema has no Participant model, match, bracket, or standing references', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).not.toMatch(/ParticipantService|ParticipantModel|ParticipantRepository/);
    expect(src).not.toMatch(/match|Match|bracket|Bracket|standing|Standing/);
  });
});

// ─── Permanent: no payment/prize/shop fields ─────────────────────────────────

describe('permanent guardrail — no payment, prize, or shop fields', () => {
  it('registration schema has no payment/prize/shop fields', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('registration service has no payment/prize/shop references', () => {
    const src = read('tournament-registration.service.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });

  it('registration types has no payment/prize/shop fields', () => {
    const src = read('tournament-registration.types.ts');
    expect(src).not.toMatch(/prize|payment|shop/i);
  });
});

// ─── Permanent: no member contact data (phone/email) ─────────────────────────

describe('permanent guardrail — no phone or email in team member data', () => {
  it('RegistrationMember schema has no phone or email fields', () => {
    const src = read('tournament-registration.schema.ts');
    const memberBlock = src.match(/class RegistrationMember[\s\S]*?\}/)?.[0] ?? '';
    expect(memberBlock).not.toMatch(/phone|email|contact/i);
  });

  it('RegistrationMemberInput type has no phone or email fields', () => {
    const src = read('tournament-registration.types.ts');
    expect(src).not.toMatch(/phone|email|contact/i);
  });
});

// ─── Permanent: public update cannot change status ───────────────────────────

describe('permanent guardrail — public update cannot change status', () => {
  it('UpdateRegistrationInput has no status field', () => {
    const src = read('tournament-registration.types.ts');
    const updateBlock =
      src.match(/export interface UpdateRegistrationInput \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(updateBlock).not.toContain('status');
  });

  it('service updateMyRegistration method signature uses UpdateRegistrationInput', () => {
    const src = read('tournament-registration.service.ts');
    expect(src).toContain('updateMyRegistration');
    expect(src).toContain('UpdateRegistrationInput');
  });
});

// ─── Permanent: no hardcoded origins ─────────────────────────────────────────

describe('permanent guardrail — no hardcoded localhost or qesb.ir', () => {
  it('registration schema has no hardcoded origin', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('registration service has no hardcoded origin', () => {
    const src = read('tournament-registration.service.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('registration policy has no hardcoded origin', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('registration repository has no hardcoded origin', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('registration projection has no hardcoded origin', () => {
    const src = read('tournament-registration-projection.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── Permanent: no fake/seed registration data ───────────────────────────────

describe('permanent guardrail — no fake or seed registration data', () => {
  it('no registration seed file exists', () => {
    expect(existsSync(join(DIR, 'registration-seed.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'tournament-registration-seed.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'seeds'))).toBe(false);
  });

  it('registration repository has no fake data', () => {
    // 'seed' as a participant seeding number field is legitimate.
    // Check for database-seeding patterns and fake data constants only.
    const src = read('tournament-registration.repository.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bseedRegistration\b|\bSEED_DATA\b|\bSEED\b/);
  });

  it('registration service has no fake data', () => {
    const src = read('tournament-registration.service.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bseedRegistration\b|\bSEED_DATA\b|\bSEED\b/);
  });
});

// ─── Schema indexes ───────────────────────────────────────────────────────────

describe('registration schema — indexes', () => {
  it('has a compound index on (tournamentId, userId)', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('tournamentId: 1');
    expect(src).toContain('userId: 1');
  });

  it('has an index on (tournamentId, status)', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('status: 1');
  });

  it('has a descending index on createdAt', () => {
    const src = read('tournament-registration.schema.ts');
    expect(src).toContain('createdAt: -1');
  });
});

// ─── Policy source coverage ───────────────────────────────────────────────────

describe('registration policy — source coverage', () => {
  it('exports isDuplicateBlocked', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('isDuplicateBlocked');
  });

  it('exports assertAdminTransition', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('assertAdminTransition');
  });

  it('exports assertUserWithdraw', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('assertUserWithdraw');
  });

  it('exports assertParticipantTypeCompatible', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('assertParticipantTypeCompatible');
  });

  it('assertAdminTransition throws UnprocessableEntityException (not BadRequestException)', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('UnprocessableEntityException');
  });

  it('duplicate policy has explicit documentation for each status', () => {
    const src = read('tournament-registration-policy.ts');
    expect(src).toContain('withdrawn');
    expect(src).toContain('cancelled');
    expect(src).toContain('rejected');
  });
});

// ─── Repository method coverage ──────────────────────────────────────────────

describe('registration repository — method coverage', () => {
  it('repository exposes findById', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('findById');
  });

  it('repository exposes findByTournamentAndUser', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('findByTournamentAndUser');
  });

  it('repository exposes findBlockingRegistration', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('findBlockingRegistration');
  });

  it('repository exposes countActive', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('countActive');
  });

  it('repository exposes list', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('list(');
  });

  it('repository exposes create', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('create(');
  });

  it('repository exposes update', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('update(');
  });

  it('repository uses findByIdAndUpdate (not deleteOne / findByIdAndDelete)', () => {
    const src = read('tournament-registration.repository.ts');
    expect(src).toContain('findByIdAndUpdate');
    expect(src).not.toContain('deleteOne');
    expect(src).not.toContain('findByIdAndDelete');
  });
});

// ─── Analytics event names ────────────────────────────────────────────────────

describe('analytics event names — exact values', () => {
  it('service uses tournament.registration_completed (not registration_completed)', () => {
    const src = read('tournament-registration.service.ts');
    expect(src).toContain('tournament.registration_completed');
    expect(src).not.toMatch(/['"]registration_completed['"]/);
    expect(src).not.toMatch(/['"]tournament_registration_completed['"]/);
  });
});

// ─── Module structure ─────────────────────────────────────────────────────────

describe('tournament-registrations module structure', () => {
  it('module file exists', () => {
    expect(existsSync(join(DIR, 'tournament-registrations.module.ts'))).toBe(true);
  });

  it('module exports TournamentRegistrationService', () => {
    const src = read('tournament-registrations.module.ts');
    expect(src).toContain('TournamentRegistrationService');
    expect(src).toContain('exports:');
  });

  it('module registers MongooseModule with TournamentRegistration schema', () => {
    const src = read('tournament-registrations.module.ts');
    expect(src).toContain('MongooseModule');
    expect(src).toContain('TournamentRegistrationSchema');
  });

  it('public controller is registered in the module', () => {
    const src = read('tournament-registrations.module.ts');
    expect(src).toContain('PublicTournamentRegistrationsController');
    expect(src).toContain('controllers:');
  });
});
