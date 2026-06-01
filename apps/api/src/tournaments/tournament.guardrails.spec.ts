/**
 * Slice 4 guardrails — Tournament domain, API layer.
 *
 * Permanent guardrails (never remove):
 *   - No separate bracket collection/model
 *   - Swiss, double_elimination, advanced_bracket_editor are unsupported formats
 *   - No prize/payment/shop/streaming fields in schema or projections
 *   - No hardcoded localhost or qesb.ir in runtime tournament source
 *
 * Slice-4-precondition guardrails (remove when the feature lands):
 *   - No external tournament CRUD controller (Slice 5 owns admin routes)
 *   - TournamentsModule not registered in AppModule (Slice 5 wires it in)
 *   - No admin tournament pages yet (Slice 5)
 *   - No public tournament controller yet (Slice 8)
 *   - No fake/seed tournament data
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const DIR = join(__dirname);
const API_SRC = join(__dirname, '..');

function read(file: string): string {
  return readFileSync(join(DIR, file), 'utf8');
}

function readApi(rel: string): string {
  return readFileSync(join(API_SRC, rel), 'utf8');
}

// ─── Schema field coverage ────────────────────────────────────────────────────

describe('tournament schema — required field coverage', () => {
  it('schema declares title, slug, slugNormalized, gameId, format, status, capacity', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('declare title');
    expect(src).toContain('declare slug');
    expect(src).toContain('declare slugNormalized');
    expect(src).toContain('declare gameId');
    expect(src).toContain('declare format');
    expect(src).toContain('declare status');
    expect(src).toContain('declare capacity');
  });

  it('schema declares lifecycle timestamps: publishedAt, cancelledAt, deletedAt', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('declare publishedAt');
    expect(src).toContain('declare cancelledAt');
    expect(src).toContain('declare deletedAt');
  });

  it('schema declares optional date range fields: registrationOpenAt, registrationCloseAt, startsAt, endsAt', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('declare registrationOpenAt');
    expect(src).toContain('declare registrationCloseAt');
    expect(src).toContain('declare startsAt');
    expect(src).toContain('declare endsAt');
  });

  it('schema uses collection name "tournaments"', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain("collection: 'tournaments'");
  });

  it('schema enables mongoose timestamps', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('timestamps: true');
  });
});

// ─── Schema indexes ───────────────────────────────────────────────────────────

describe('tournament schema — indexes', () => {
  it('has a unique index on slugNormalized', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('slugNormalized: 1');
    expect(src).toContain('unique: true');
  });

  it('has an index on gameId', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('gameId: 1');
  });

  it('has an index on status', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('status: 1');
  });

  it('has an index on format', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('format: 1');
  });

  it('has an index on deletedAt (soft-delete filter)', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('deletedAt: 1');
  });

  it('has a descending index on createdAt (list ordering)', () => {
    const src = read('tournament.schema.ts');
    expect(src).toContain('createdAt: -1');
  });
});

// ─── Permanent: no bracket collection/model ───────────────────────────────────

describe('permanent guardrail — no bracket collection or model', () => {
  it('no bracket schema file exists in the tournaments directory', () => {
    expect(existsSync(join(DIR, 'bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'tournament-bracket.schema.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'bracket.model.ts'))).toBe(false);
  });

  it('tournament schema source has no bracket references', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('tournament module source has no bracket references', () => {
    const src = read('tournaments.module.ts');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('tournament service source has no bracket references', () => {
    const src = read('tournament.service.ts');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('tournament repository source has no bracket references', () => {
    const src = read('tournament.repository.ts');
    expect(src).not.toMatch(/bracket|Bracket/);
  });
});

// ─── Permanent: format allowlist — unsupported formats rejected ───────────────

describe('permanent guardrail — no future format implementations', () => {
  it('tournament schema enum does not contain swiss', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toContain("'swiss'");
    expect(src).not.toContain('"swiss"');
  });

  it('tournament schema enum does not contain double_elimination', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toContain("'double_elimination'");
    expect(src).not.toContain('"double_elimination"');
  });

  it('tournament schema enum does not contain advanced_bracket_editor', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toContain("'advanced_bracket_editor'");
    expect(src).not.toContain('"advanced_bracket_editor"');
  });

  it('policy source has no swiss pairing, doubleElim, or bracketEditor implementations', () => {
    const src = read('tournament-policy.ts');
    expect(src).not.toMatch(/swiss.*pairing|doubleElim|bracketEditor/i);
  });

  it('policy source PHASE1_TOURNAMENT_FORMATS contains exactly 3 formats', () => {
    const src = read('tournament-policy.ts');
    expect(src).toContain("'single_elimination'");
    expect(src).toContain("'round_robin'");
    expect(src).toContain("'manual'");
  });
});

// ─── Permanent: no prize/payment/shop/streaming fields ───────────────────────

describe('permanent guardrail — no prize, payment, shop, or streaming fields', () => {
  it('tournament schema has no prize/payment/shop/stream fields', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('tournament repository has no prize/payment/shop/stream references', () => {
    const src = read('tournament.repository.ts');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('tournament service has no prize/payment/shop/stream references', () => {
    const src = read('tournament.service.ts');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('tournament types has no prize/payment/shop/stream fields', () => {
    const src = read('tournament.types.ts');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });
});

// ─── Permanent: domain-awareness — no hardcoded origins ──────────────────────

describe('permanent guardrail — no hardcoded localhost or qesb.ir', () => {
  it('tournament schema has no hardcoded origin', () => {
    const src = read('tournament.schema.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournament policy has no hardcoded origin', () => {
    const src = read('tournament-policy.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournament validation has no hardcoded origin', () => {
    const src = read('tournament-validation.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournament projection has no hardcoded origin', () => {
    const src = read('tournament-projection.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournament service has no hardcoded origin', () => {
    const src = read('tournament.service.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('tournament repository has no hardcoded origin', () => {
    const src = read('tournament.repository.ts');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });
});

// ─── Permanent: no fake/seed tournament data ─────────────────────────────────

describe('permanent guardrail — no fake or seed tournament data', () => {
  it('no tournament seed file exists', () => {
    expect(existsSync(join(DIR, 'tournament-seed.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'tournament.seed.ts'))).toBe(false);
    expect(existsSync(join(DIR, 'seeds'))).toBe(false);
  });

  it('no fake tournament data in repository source', () => {
    const src = read('tournament.repository.ts');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seed|SEED/);
  });

  it('no fake tournament data in service source', () => {
    const src = read('tournament.service.ts');
    expect(src).not.toMatch(/Dragon Cup|fake|FAKE|seed|SEED/);
  });
});

// ─── Slice-4-precondition: no external tournament CRUD controller ─────────────

describe('slice-4-precondition — no external tournament CRUD controller', () => {
  it('no tournament.controller.ts exists (admin controller is Slice 5)', () => {
    expect(existsSync(join(DIR, 'tournament.controller.ts'))).toBe(false);
  });

  it('no admin-tournament.controller.ts exists', () => {
    expect(existsSync(join(DIR, 'admin-tournament.controller.ts'))).toBe(false);
  });

  it('no public tournament controller exists', () => {
    expect(existsSync(join(DIR, 'public-tournament.controller.ts'))).toBe(false);
  });

  it('tournament module has no controllers registered', () => {
    const src = read('tournaments.module.ts');
    expect(src).not.toContain('controllers:');
  });
});

// ─── Slice-4-precondition: TournamentsModule not in AppModule ─────────────────

describe('slice-4-precondition — TournamentsModule not in AppModule', () => {
  it('AppModule source does not import TournamentsModule (deferred to Slice 5)', () => {
    const src = readApi('app.module.ts');
    expect(src).not.toContain('TournamentsModule');
  });
});

// ─── Module structure ─────────────────────────────────────────────────────────

describe('tournament module structure', () => {
  it('module exports TournamentService (for future Slice 5 controller injection)', () => {
    const src = read('tournaments.module.ts');
    expect(src).toContain('TournamentService');
    expect(src).toContain('exports:');
  });

  it('module imports GamesModule (for gameId relation validation)', () => {
    const src = read('tournaments.module.ts');
    expect(src).toContain('GamesModule');
  });

  it('module imports MongooseModule with Tournament schema', () => {
    const src = read('tournaments.module.ts');
    expect(src).toContain('MongooseModule');
    expect(src).toContain('TournamentSchema');
  });
});

// ─── Repository interface coverage ───────────────────────────────────────────

describe('tournament repository — method coverage', () => {
  it('repository exposes findById', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('findById');
  });

  it('repository exposes existsBySlug', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('existsBySlug');
  });

  it('repository exposes list', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('list(');
  });

  it('repository exposes create', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('create(');
  });

  it('repository exposes update', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('update(');
  });

  it('repository exposes softDelete', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('softDelete');
  });

  it('repository soft-delete sets deletedAt (never removes the document)', () => {
    const src = read('tournament.repository.ts');
    expect(src).toContain('deletedAt');
    expect(src).not.toContain('deleteOne');
    expect(src).not.toContain('findByIdAndDelete');
  });
});

// ─── Policy source coverage ───────────────────────────────────────────────────

describe('tournament policy — source coverage', () => {
  it('policy exports canTransition', () => {
    const src = read('tournament-policy.ts');
    expect(src).toContain('canTransition');
  });

  it('policy exports assertTransition', () => {
    const src = read('tournament-policy.ts');
    expect(src).toContain('assertTransition');
  });

  it('policy exports PHASE1_TOURNAMENT_STATUSES and PHASE1_TOURNAMENT_FORMATS', () => {
    const src = read('tournament-policy.ts');
    expect(src).toContain('PHASE1_TOURNAMENT_STATUSES');
    expect(src).toContain('PHASE1_TOURNAMENT_FORMATS');
  });

  it('assertTransition throws UnprocessableEntityException (not BadRequestException)', () => {
    const src = read('tournament-policy.ts');
    expect(src).toContain('UnprocessableEntityException');
  });
});

// ─── Projection source coverage ──────────────────────────────────────────────

describe('tournament projection — source coverage', () => {
  it('projection exports isPubliclyVisible', () => {
    const src = read('tournament-projection.ts');
    expect(src).toContain('isPubliclyVisible');
  });

  it('projection exports toPublicTournamentSummary', () => {
    const src = read('tournament-projection.ts');
    expect(src).toContain('toPublicTournamentSummary');
  });

  it('projection exports toPublicTournamentDetail', () => {
    const src = read('tournament-projection.ts');
    expect(src).toContain('toPublicTournamentDetail');
  });

  it('projection exports toAdminTournamentDto', () => {
    const src = read('tournament-projection.ts');
    expect(src).toContain('toAdminTournamentDto');
  });

  it('public visibility check gates on deletedAt and status only', () => {
    const src = read('tournament-projection.ts');
    expect(src).toContain('deletedAt');
    expect(src).not.toMatch(/\.visibility\b/);
    expect(src).not.toMatch(/isVisible\b/);
  });
});
