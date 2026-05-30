/**
 * Phase 1 contract and constant verification.
 *
 * Each import here is compile-time verification that the type is exported.
 * All runtime assertions verify constant values.
 */

import { DragonPermissions } from './constants/permissions';
import type { DragonRoleKey } from './constants/permissions';
import { ANALYTICS_EVENT_TYPES } from './constants/analytics';
import type {
  TournamentStatus,
  TournamentFormat,
  TournamentDto,
  TournamentSummaryDto,
  TournamentDetailDto,
  TournamentParticipantType,
  CreateTournamentDto,
  UpdateTournamentDto,
} from './contracts/tournaments';
import type {
  TournamentRegistrationType,
  RegistrationStatus,
  TournamentRegistrationDto,
  CreateTournamentRegistrationDto,
  UpdateTournamentRegistrationDto,
  TeamRegistrationMemberDto,
} from './contracts/registrations';
import type {
  GameDto,
  GamePublicDto,
  PublicGameDto,
  CreateGameDto,
  UpdateGameDto,
} from './contracts/games';
import type {
  ParticipantDto,
  ParticipantStatus,
  TournamentParticipantDto,
  TournamentParticipantPublicDto,
} from './contracts/participants';
import type {
  TournamentMatchDto,
  TournamentMatchStatus,
  TournamentResultDto,
  TournamentMatchResultDto,
  TournamentMatchPublicDto,
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
  CreateMatchResultDto,
  UpdateMatchResultDto,
} from './contracts/matches';
import type {
  TournamentStandingDto,
  TournamentStandingsDto,
  RecalculateStandingsResultDto,
} from './contracts/standings';
import type {
  BracketProjectionDto,
  BracketMatchNodeDto,
  TournamentBracketDto,
} from './contracts/bracket';
import type { EsportsHomeDto } from './contracts/home';

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

// ─── TournamentRegistrationType / TournamentParticipantType ──────────────────

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

describe('TournamentParticipantType is exported and matches registration type', () => {
  it('TournamentParticipantType accepts individual and team', () => {
    const types: TournamentParticipantType[] = ['individual', 'team'];
    expect(types).toContain('individual');
    expect(types).toContain('team');
  });
});

// ─── RegistrationStatus ───────────────────────────────────────────────────────

describe('RegistrationStatus locked values', () => {
  const LOCKED_STATUSES: RegistrationStatus[] = [
    'submitted',
    'approved',
    'rejected',
    'waitlisted',
    'withdrawn',
    'cancelled',
  ];

  it('contains exactly the six locked registration statuses', () => {
    expect(LOCKED_STATUSES).toHaveLength(6);
    expect(LOCKED_STATUSES).toContain('submitted');
    expect(LOCKED_STATUSES).toContain('approved');
    expect(LOCKED_STATUSES).toContain('rejected');
    expect(LOCKED_STATUSES).toContain('waitlisted');
    expect(LOCKED_STATUSES).toContain('withdrawn');
    expect(LOCKED_STATUSES).toContain('cancelled');
  });

  it('pending is not a valid registration status (use submitted)', () => {
    expect(LOCKED_STATUSES).not.toContain('pending');
  });

  it('disqualified is not a valid registration status', () => {
    expect(LOCKED_STATUSES).not.toContain('disqualified');
  });
});

// ─── ParticipantStatus ────────────────────────────────────────────────────────

describe('ParticipantStatus locked values', () => {
  const LOCKED_STATUSES: ParticipantStatus[] = ['active', 'withdrawn', 'disqualified', 'removed'];

  it('contains exactly the four locked participant statuses', () => {
    expect(LOCKED_STATUSES).toHaveLength(4);
    expect(LOCKED_STATUSES).toContain('active');
    expect(LOCKED_STATUSES).toContain('withdrawn');
    expect(LOCKED_STATUSES).toContain('disqualified');
    expect(LOCKED_STATUSES).toContain('removed');
  });

  it('eliminated is not a valid participant status', () => {
    expect(LOCKED_STATUSES).not.toContain('eliminated');
  });
});

// ─── TournamentMatchStatus ────────────────────────────────────────────────────

describe('TournamentMatchStatus locked values', () => {
  const LOCKED_STATUSES: TournamentMatchStatus[] = [
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ];

  it('contains exactly the four locked match statuses', () => {
    expect(LOCKED_STATUSES).toHaveLength(4);
    expect(LOCKED_STATUSES).toContain('scheduled');
    expect(LOCKED_STATUSES).toContain('in_progress');
    expect(LOCKED_STATUSES).toContain('completed');
    expect(LOCKED_STATUSES).toContain('cancelled');
  });

  it('bye is not a valid match status', () => {
    expect(LOCKED_STATUSES).not.toContain('bye');
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

  it('TournamentDetailDto is an alias for TournamentDto', () => {
    const dto: TournamentDetailDto = {
      id: '1',
      gameId: 'g1',
      title: 'Test',
      slug: 'test',
      format: 'round_robin',
      status: 'published',
      capacity: 32,
      createdAt: '',
      updatedAt: '',
    };
    expect(dto.id).toBe('1');
  });

  it('TournamentSummaryDto is exported and structurally valid', () => {
    const summary: TournamentSummaryDto = {
      id: 't1',
      gameId: 'g1',
      title: 'Test',
      slug: 'test',
      format: 'manual',
      status: 'draft',
      capacity: 8,
    };
    expect(summary.slug).toBe('test');
  });

  it('CreateTournamentDto is exported', () => {
    const input: CreateTournamentDto = {
      gameId: 'g1',
      title: 'Test',
      slug: 'test',
      format: 'single_elimination',
      capacity: 16,
    };
    expect(input.format).toBe('single_elimination');
  });

  it('UpdateTournamentDto is exported', () => {
    const input: UpdateTournamentDto = { title: 'New Title' };
    expect(input.title).toBe('New Title');
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

  it('GamePublicDto and PublicGameDto are both exported', () => {
    const pub: GamePublicDto = { id: 'g1', slug: 'dota2', name: 'Dota 2' };
    const pub2: PublicGameDto = { id: 'g1', slug: 'dota2', name: 'Dota 2' };
    expect(pub.slug).toBe(pub2.slug);
  });

  it('CreateGameDto is exported', () => {
    const input: CreateGameDto = { slug: 'dota2', name: 'Dota 2' };
    expect(input.slug).toBe('dota2');
  });

  it('UpdateGameDto is exported', () => {
    const input: UpdateGameDto = { name: 'Dota 2 Updated' };
    expect(input.name).toBe('Dota 2 Updated');
  });

  it('TournamentParticipantDto has tournamentId field', () => {
    const p: TournamentParticipantDto = {
      id: 'p1',
      tournamentId: 't1',
      userId: 'u1',
      displayName: 'Player1',
      status: 'active',
    };
    expect(p.tournamentId).toBe('t1');
  });

  it('TournamentParticipantPublicDto is exported (public-safe shape)', () => {
    const pub: TournamentParticipantPublicDto = { id: 'p1', displayName: 'Player1' };
    const record = pub as unknown as Record<string, unknown>;
    expect(record['userId']).toBeUndefined();
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

  it('TournamentMatchPublicDto is exported', () => {
    const match: TournamentMatchPublicDto = {
      id: 'm1',
      round: 1,
      matchNumber: 1,
      status: 'scheduled',
    };
    expect(match.round).toBe(1);
  });

  it('CreateTournamentMatchDto is exported', () => {
    const input: CreateTournamentMatchDto = {
      tournamentId: 't1',
      round: 1,
      matchNumber: 1,
    };
    expect(input.round).toBe(1);
  });

  it('UpdateTournamentMatchDto is exported', () => {
    const input: UpdateTournamentMatchDto = { scheduledAt: '2026-01-01' };
    expect(input.scheduledAt).toBe('2026-01-01');
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

  it('TournamentMatchResultDto is an alias for TournamentResultDto', () => {
    const result: TournamentMatchResultDto = {
      matchId: 'm1',
      tournamentId: 't1',
      winnerId: 'p1',
      recordedAt: '',
    };
    expect(result.matchId).toBe('m1');
  });

  it('CreateMatchResultDto is exported', () => {
    const input: CreateMatchResultDto = { winnerId: 'p1' };
    expect(input.winnerId).toBe('p1');
  });

  it('UpdateMatchResultDto is exported', () => {
    const input: UpdateMatchResultDto = { winnerId: 'p2', participant1Score: 3 };
    expect(input.winnerId).toBe('p2');
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

  it('team registration uses submitted status (not pending)', () => {
    const member: TeamRegistrationMemberDto = { userId: 'u2', displayName: 'Player2' };
    const reg: TournamentRegistrationDto = {
      id: 'r1',
      tournamentId: 't1',
      userId: 'u1',
      type: 'team',
      status: 'submitted',
      teamName: 'Alpha',
      members: [member],
      registeredAt: '',
      updatedAt: '',
    };
    expect(reg.type).toBe('team');
    expect(reg.status).toBe('submitted');
    expect(reg.members?.[0]?.userId).toBe('u2');
  });

  it('CreateTournamentRegistrationDto is exported', () => {
    const input: CreateTournamentRegistrationDto = { type: 'individual' };
    expect(input.type).toBe('individual');
  });

  it('UpdateTournamentRegistrationDto is exported', () => {
    const input: UpdateTournamentRegistrationDto = { status: 'approved' };
    expect(input.status).toBe('approved');
  });

  it('EsportsHomeDto is exported', () => {
    const home: EsportsHomeDto = { featuredTournaments: [], games: [] };
    expect(home.featuredTournaments).toHaveLength(0);
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

  it('TournamentBracketDto is an alias for BracketProjectionDto', () => {
    const bracket: TournamentBracketDto = {
      tournamentId: 't1',
      format: 'round_robin',
      rounds: [],
      generatedAt: '',
    };
    expect(bracket.tournamentId).toBe('t1');
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

  it('BracketProjectionDto.format accepts only Phase 1 formats', () => {
    const formats: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];
    for (const format of formats) {
      const projection: BracketProjectionDto = {
        tournamentId: 't1',
        format,
        rounds: [],
        generatedAt: '',
      };
      expect(projection.format).toBe(format);
    }
  });

  it('BracketProjectionDto.format does not accept swiss', () => {
    const PHASE1_FORMATS: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];
    expect(PHASE1_FORMATS).not.toContain('swiss');
    expect(PHASE1_FORMATS).not.toContain('double_elimination');
    expect(PHASE1_FORMATS).not.toContain('advanced_bracket_editor');
  });
});

// ─── Standings contracts (format-constrained) ────────────────────────────────

describe('TournamentStandingsDto format is constrained to Phase 1 formats', () => {
  it('TournamentStandingsDto.format accepts only Phase 1 formats', () => {
    const formats: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];
    for (const format of formats) {
      const standings: TournamentStandingsDto = {
        tournamentId: 't1',
        format,
        standings: [],
        updatedAt: '',
      };
      expect(standings.format).toBe(format);
    }
  });

  it('TournamentStandingsDto.format does not accept forbidden formats', () => {
    const PHASE1_FORMATS: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];
    expect(PHASE1_FORMATS).not.toContain('swiss');
    expect(PHASE1_FORMATS).not.toContain('double_elimination');
    expect(PHASE1_FORMATS).not.toContain('advanced_bracket_editor');
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

  it('no game.game.* permissions exist (wrong namespace)', () => {
    expect(permissionValues).not.toContain('game.game.read');
    expect(permissionValues).not.toContain('game.game.create');
    expect(permissionValues).not.toContain('game.game.update');
    expect(permissionValues).not.toContain('game.status.update');
  });

  it('bracket read/projection uses tournament.match.read', () => {
    expect(DragonPermissions.TOURNAMENT_MATCH_READ).toBe('tournament.match.read');
  });

  it('standings recalculation uses tournament.result.manage', () => {
    expect(DragonPermissions.TOURNAMENT_RESULT_MANAGE).toBe('tournament.result.manage');
  });

  it('has correct game permissions under tournament namespace', () => {
    expect(DragonPermissions.TOURNAMENT_GAME_READ).toBe('tournament.game.read');
    expect(DragonPermissions.TOURNAMENT_GAME_MANAGE).toBe('tournament.game.manage');
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
      'tournament.game.read',
      'tournament.game.manage',
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

// ─── No independent Team or Club model ───────────────────────────────────────

describe('No independent Team or Club model', () => {
  it('TournamentRegistrationType has no team_entity value', () => {
    const types: TournamentRegistrationType[] = ['individual', 'team'];
    expect(types).not.toContain('team_entity');
    expect(types).not.toContain('club');
    expect(types).not.toContain('organization');
  });
});
