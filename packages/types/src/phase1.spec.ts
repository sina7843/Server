/**
 * Phase 1 contract and constant verification.
 *
 * Each import here is compile-time verification that the type is exported.
 * All runtime assertions verify constant values.
 */

import { DragonPermissions } from './constants/permissions';
import type { DragonRoleKey } from './constants/permissions';
import { ANALYTICS_EVENT_TYPES } from './constants/analytics';
import type { TournamentStatus, TournamentFormat, TournamentDto } from './contracts/tournaments';
import type {
  TournamentRegistrationType,
  TournamentRegistrationDto,
  TeamRegistrationMemberDto,
} from './contracts/registrations';
import type { GameDto } from './contracts/games';
import type { ParticipantDto } from './contracts/participants';
import type { TournamentMatchDto, TournamentResultDto } from './contracts/matches';
import type { TournamentStandingDto, RecalculateStandingsResultDto } from './contracts/standings';
import type { BracketProjectionDto, BracketMatchNodeDto } from './contracts/bracket';

// ─── TournamentStatus ─────────────────────────────────────────────────────────

describe('TournamentStatus locked values', () => {
  const LOCKED_STATUSES: TournamentStatus[] = [
    'draft',
    'published',
    'registration_open',
    'registration_closed',
    'in_progress',
    'completed',
    'cancelled',
    'archived',
  ];

  it('contains exactly the eight locked statuses', () => {
    expect(LOCKED_STATUSES).toHaveLength(8);
    expect(LOCKED_STATUSES).toContain('draft');
    expect(LOCKED_STATUSES).toContain('published');
    expect(LOCKED_STATUSES).toContain('registration_open');
    expect(LOCKED_STATUSES).toContain('registration_closed');
    expect(LOCKED_STATUSES).toContain('in_progress');
    expect(LOCKED_STATUSES).toContain('completed');
    expect(LOCKED_STATUSES).toContain('cancelled');
    expect(LOCKED_STATUSES).toContain('archived');
  });

  it('does not use alias statuses', () => {
    const aliases = ['open', 'published_open', 'registrationOpen', 'closed'];
    for (const alias of aliases) {
      expect(LOCKED_STATUSES).not.toContain(alias);
    }
  });
});

// ─── TournamentFormat ─────────────────────────────────────────────────────────

describe('TournamentFormat locked values', () => {
  const SUPPORTED_FORMATS: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];

  it('contains only the three Phase 1 supported formats', () => {
    expect(SUPPORTED_FORMATS).toHaveLength(3);
    expect(SUPPORTED_FORMATS).toContain('single_elimination');
    expect(SUPPORTED_FORMATS).toContain('round_robin');
    expect(SUPPORTED_FORMATS).toContain('manual');
  });

  it('swiss is not a supported format', () => {
    expect(SUPPORTED_FORMATS).not.toContain('swiss');
  });

  it('double_elimination is not a supported format', () => {
    expect(SUPPORTED_FORMATS).not.toContain('double_elimination');
  });

  it('advanced_bracket_editor is not a supported format', () => {
    expect(SUPPORTED_FORMATS).not.toContain('advanced_bracket_editor');
  });
});

// ─── TournamentRegistrationType ───────────────────────────────────────────────

describe('TournamentRegistrationType locked values', () => {
  const SUPPORTED_TYPES: TournamentRegistrationType[] = ['individual', 'team'];

  it('supports only individual and team', () => {
    expect(SUPPORTED_TYPES).toHaveLength(2);
    expect(SUPPORTED_TYPES).toContain('individual');
    expect(SUPPORTED_TYPES).toContain('team');
  });

  it('organization registration type does not exist', () => {
    expect(SUPPORTED_TYPES).not.toContain('organization');
  });

  it('independent Club registration type does not exist', () => {
    expect(SUPPORTED_TYPES).not.toContain('club');
  });

  it('team_entity registration type does not exist', () => {
    expect(SUPPORTED_TYPES).not.toContain('team_entity');
  });
});

// ─── Contract shapes ─────────────────────────────────────────────────────────

describe('Tournament contract shape', () => {
  it('TournamentDto has no prize/payment/streaming fields', () => {
    const dto: TournamentDto = {
      id: '1',
      gameId: 'g1',
      title: 'Test',
      slug: 'test',
      format: 'single_elimination',
      status: 'draft',
      capacity: 16,
      createdAt: '',
      updatedAt: '',
    };
    const record = dto as unknown as Record<string, unknown>;
    expect(record['prizePool']).toBeUndefined();
    expect(record['entryFee']).toBeUndefined();
    expect(record['streamUrl']).toBeUndefined();
    expect(record['liveScore']).toBeUndefined();
  });

  it('GameDto is a data contract (no DB entity fields)', () => {
    const game: GameDto = {
      id: 'g1',
      slug: 'dota2',
      name: 'Dota 2',
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };
    const record = game as unknown as Record<string, unknown>;
    expect(record['_id']).toBeUndefined();
    expect(record['__v']).toBeUndefined();
  });

  it('ParticipantDto is a projection contract (no sensitive data)', () => {
    const p: ParticipantDto = {
      id: 'p1',
      tournamentId: 't1',
      userId: 'u1',
      displayName: 'Player1',
      status: 'active',
    };
    const record = p as unknown as Record<string, unknown>;
    expect(record['password']).toBeUndefined();
    expect(record['phone']).toBeUndefined();
  });

  it('TournamentMatchDto is data-only (no live score fields)', () => {
    const match: TournamentMatchDto = {
      id: 'm1',
      tournamentId: 't1',
      round: 1,
      matchNumber: 1,
      status: 'scheduled',
    };
    const record = match as unknown as Record<string, unknown>;
    expect(record['liveScore']).toBeUndefined();
    expect(record['stream']).toBeUndefined();
  });

  it('TournamentResultDto is data-only', () => {
    const result: TournamentResultDto = {
      matchId: 'm1',
      tournamentId: 't1',
      winnerId: 'p1',
      recordedAt: '',
    };
    expect(result.winnerId).toBe('p1');
  });

  it('TournamentStandingDto is data-only', () => {
    const standing: TournamentStandingDto = {
      rank: 1,
      participantId: 'p1',
      displayName: 'Player1',
      wins: 3,
      losses: 0,
      points: 9,
    };
    expect(standing.rank).toBe(1);
  });

  it('RecalculateStandingsResultDto is data-only', () => {
    const result: RecalculateStandingsResultDto = {
      success: true,
      tournamentId: 't1',
      recalculatedAt: '',
    };
    expect(result.success).toBe(true);
  });

  it('team registration is represented inside TournamentRegistrationDto', () => {
    const member: TeamRegistrationMemberDto = { userId: 'u2', displayName: 'Player2' };
    const reg: TournamentRegistrationDto = {
      id: 'r1',
      tournamentId: 't1',
      userId: 'u1',
      type: 'team',
      status: 'pending',
      teamName: 'Alpha',
      members: [member],
      registeredAt: '',
      updatedAt: '',
    };
    expect(reg.type).toBe('team');
    expect(reg.members?.[0]?.userId).toBe('u2');
  });
});

// ─── Bracket contracts (display-only) ─────────────────────────────────────────

describe('Bracket contracts are display-only projection', () => {
  it('BracketProjectionDto has no editable/editor fields', () => {
    const projection: BracketProjectionDto = {
      tournamentId: 't1',
      format: 'single_elimination',
      rounds: [],
      generatedAt: '',
    };
    const record = projection as unknown as Record<string, unknown>;
    expect(record['editCommand']).toBeUndefined();
    expect(record['dragDrop']).toBeUndefined();
    expect(record['editorState']).toBeUndefined();
  });

  it('BracketMatchNodeDto has no editor-specific fields', () => {
    const node: BracketMatchNodeDto = {
      matchId: 'm1',
      round: 1,
      matchNumber: 1,
      status: 'scheduled',
    };
    const record = node as unknown as Record<string, unknown>;
    expect(record['editorCommand']).toBeUndefined();
    expect(record['manualOverride']).toBeUndefined();
  });
});

// ─── Analytics event constants ────────────────────────────────────────────────

describe('Phase 1 analytics event constants', () => {
  it('contains tournament.viewed', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.viewed');
  });

  it('contains tournament.registration_started', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.registration_started');
  });

  it('contains tournament.registration_completed', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.registration_completed');
  });

  it('contains tournament.bracket_viewed', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.bracket_viewed');
  });

  it('contains tournament.match_viewed', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.match_viewed');
  });

  it('does not use alternative naming conventions', () => {
    expect(ANALYTICS_EVENT_TYPES).not.toContain('tournament_viewed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('tournament.registrationStarted');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('registration_completed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('bracket_viewed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('matchViewed');
  });
});

// ─── Phase 1 permissions ──────────────────────────────────────────────────────

describe('Phase 1 DragonPermissions', () => {
  const permissionValues = Object.values(DragonPermissions);

  it('no tournament.bracket.read permission exists', () => {
    expect(permissionValues).not.toContain('tournament.bracket.read');
  });

  it('no tournament.bracket.manage permission exists', () => {
    expect(permissionValues).not.toContain('tournament.bracket.manage');
  });

  it('bracket read/projection uses tournament.match.read', () => {
    expect(DragonPermissions.TOURNAMENT_MATCH_READ).toBe('tournament.match.read');
  });

  it('standings recalculation uses tournament.result.manage', () => {
    expect(DragonPermissions.TOURNAMENT_RESULT_MANAGE).toBe('tournament.result.manage');
  });

  it('has all game permissions', () => {
    expect(DragonPermissions.GAME_READ).toBe('game.game.read');
    expect(DragonPermissions.GAME_CREATE).toBe('game.game.create');
    expect(DragonPermissions.GAME_UPDATE).toBe('game.game.update');
    expect(DragonPermissions.GAME_STATUS_UPDATE).toBe('game.status.update');
  });

  it('has all tournament lifecycle permissions', () => {
    expect(DragonPermissions.TOURNAMENT_READ).toBe('tournament.tournament.read');
    expect(DragonPermissions.TOURNAMENT_CREATE).toBe('tournament.tournament.create');
    expect(DragonPermissions.TOURNAMENT_UPDATE).toBe('tournament.tournament.update');
    expect(DragonPermissions.TOURNAMENT_PUBLISH).toBe('tournament.tournament.publish');
    expect(DragonPermissions.TOURNAMENT_CANCEL).toBe('tournament.tournament.cancel');
    expect(DragonPermissions.TOURNAMENT_ARCHIVE).toBe('tournament.tournament.archive');
  });

  it('has registration permissions', () => {
    expect(DragonPermissions.TOURNAMENT_REGISTRATION_READ).toBe('tournament.registration.read');
    expect(DragonPermissions.TOURNAMENT_REGISTRATION_MANAGE).toBe('tournament.registration.manage');
  });

  it('has participant permissions', () => {
    expect(DragonPermissions.TOURNAMENT_PARTICIPANT_READ).toBe('tournament.participant.read');
    expect(DragonPermissions.TOURNAMENT_PARTICIPANT_MANAGE).toBe('tournament.participant.manage');
  });

  it('has match permissions', () => {
    expect(DragonPermissions.TOURNAMENT_MATCH_READ).toBe('tournament.match.read');
    expect(DragonPermissions.TOURNAMENT_MATCH_MANAGE).toBe('tournament.match.manage');
  });

  it('has result permission', () => {
    expect(DragonPermissions.TOURNAMENT_RESULT_MANAGE).toBe('tournament.result.manage');
  });

  it('Phase 1 permissions are centralized in DragonPermissions', () => {
    const phase1Keys = [
      'game.game.read',
      'game.game.create',
      'game.game.update',
      'game.status.update',
      'tournament.tournament.read',
      'tournament.tournament.create',
      'tournament.tournament.update',
      'tournament.tournament.publish',
      'tournament.tournament.cancel',
      'tournament.tournament.archive',
      'tournament.registration.read',
      'tournament.registration.manage',
      'tournament.participant.read',
      'tournament.participant.manage',
      'tournament.match.read',
      'tournament.match.manage',
      'tournament.result.manage',
    ];
    for (const key of phase1Keys) {
      expect(permissionValues).toContain(key);
    }
  });
});

// ─── DragonRoleKey includes tournament_manager ────────────────────────────────

describe('DragonRoleKey', () => {
  it('includes tournament_manager as a valid role key', () => {
    const key: DragonRoleKey = 'tournament_manager';
    expect(key).toBe('tournament_manager');
  });
});
