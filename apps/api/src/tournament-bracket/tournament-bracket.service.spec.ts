import { TournamentBracketService } from './tournament-bracket.service';
import { Types } from 'mongoose';
import type { BracketRoundDto } from '@dragon/types';
import type { TournamentMatchDocument } from '../tournament-matches/tournament-match.schema';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TOURNAMENT_OID = new Types.ObjectId('507f1f77bcf86cd799439011');
const P1_OID = new Types.ObjectId('507f1f77bcf86cd799439001');
const P2_OID = new Types.ObjectId('507f1f77bcf86cd799439002');
const P3_OID = new Types.ObjectId('507f1f77bcf86cd799439003');
const P4_OID = new Types.ObjectId('507f1f77bcf86cd799439004');

function makeParticipant(
  id: Types.ObjectId,
  userId: string,
  overrides: Partial<Record<string, unknown>> = {},
): TournamentRegistrationDocument {
  return {
    _id: id,
    userId,
    tournamentId: TOURNAMENT_OID,
    status: 'approved',
    ...overrides,
  } as unknown as TournamentRegistrationDocument;
}

function makeMatch(
  round: number,
  matchNumber: number,
  overrides: Partial<Record<string, unknown>> = {},
): TournamentMatchDocument {
  return {
    _id: new Types.ObjectId(),
    tournamentId: TOURNAMENT_OID,
    round,
    matchNumber,
    status: 'scheduled',
    ...overrides,
  } as unknown as TournamentMatchDocument;
}

function makeService(matches: TournamentMatchDocument[]) {
  const repoMock = {
    list: jest.fn().mockResolvedValue({ items: matches, total: matches.length }),
  };
  const service = new TournamentBracketService(repoMock as never);
  return { service, repoMock };
}

const PARTICIPANTS = [
  makeParticipant(P1_OID, 'user1', { participantDisplayName: 'Player One', seed: 1 }),
  makeParticipant(P2_OID, 'user2', { participantDisplayName: 'Player Two', seed: 2 }),
  makeParticipant(P3_OID, 'user3', { seed: 3 }),
  makeParticipant(P4_OID, 'user4'),
];

// ─── empty bracket ────────────────────────────────────────────────────────────

describe('TournamentBracketService — empty', () => {
  it('returns empty rounds when no matches exist', async () => {
    const { service } = makeService([]);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);
    expect(result.rounds).toHaveLength(0);
    expect(result.tournamentId).toBe(String(TOURNAMENT_OID));
    expect(result.format).toBe('single_elimination');
    expect(result.generatedAt).toBeDefined();
  });
});

// ─── round grouping ───────────────────────────────────────────────────────────

describe('TournamentBracketService — round grouping', () => {
  it('groups matches by round', async () => {
    const matches = [
      makeMatch(1, 1, { participant1Id: P1_OID, participant2Id: P2_OID }),
      makeMatch(1, 2, { participant1Id: P3_OID, participant2Id: P4_OID }),
      makeMatch(2, 1),
    ];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    expect(result.rounds).toHaveLength(2);
    expect(getRound(result.rounds, 0).round).toBe(1);
    expect(getRound(result.rounds, 0).matches).toHaveLength(2);
    expect(getRound(result.rounds, 1).round).toBe(2);
    expect(getRound(result.rounds, 1).matches).toHaveLength(1);
  });

  it('sorts matches within each round by matchNumber', async () => {
    const matches = [makeMatch(1, 3), makeMatch(1, 1), makeMatch(1, 2)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const round1 = getRound(result.rounds, 0);
    expect(round1.matches[0]?.matchNumber).toBe(1);
    expect(round1.matches[1]?.matchNumber).toBe(2);
    expect(round1.matches[2]?.matchNumber).toBe(3);
  });
});

// ─── single_elimination labels ────────────────────────────────────────────────

describe('TournamentBracketService — single_elimination labels', () => {
  it('labels last round as Final', async () => {
    const matches = [makeMatch(1, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);
    expect(getRound(result.rounds, 0).label).toBe('Final');
  });

  it('labels second-to-last round as Semifinal when maxRound >= 2', async () => {
    const matches = [makeMatch(1, 1), makeMatch(2, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    expect(getRound(result.rounds, 0).label).toBe('Semifinal');
    expect(getRound(result.rounds, 1).label).toBe('Final');
  });

  it('labels third-to-last round as Quarterfinal when maxRound >= 3', async () => {
    const matches = [makeMatch(1, 1), makeMatch(2, 1), makeMatch(3, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    expect(getRound(result.rounds, 0).label).toBe('Quarterfinal');
    expect(getRound(result.rounds, 1).label).toBe('Semifinal');
    expect(getRound(result.rounds, 2).label).toBe('Final');
  });

  it('uses Round N for earlier rounds when there are many rounds', async () => {
    const matches = [1, 2, 3, 4].map((r) => makeMatch(r, 1));
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    expect(getRound(result.rounds, 0).label).toBe('Round 1');
    expect(getRound(result.rounds, 1).label).toBe('Quarterfinal');
    expect(getRound(result.rounds, 2).label).toBe('Semifinal');
    expect(getRound(result.rounds, 3).label).toBe('Final');
  });
});

// ─── round_robin / manual labels ─────────────────────────────────────────────

describe('TournamentBracketService — round_robin labels', () => {
  it('uses Round N labels for round_robin', async () => {
    const matches = [makeMatch(1, 1), makeMatch(2, 1), makeMatch(3, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    expect(getRound(result.rounds, 0).label).toBe('Round 1');
    expect(getRound(result.rounds, 1).label).toBe('Round 2');
    expect(getRound(result.rounds, 2).label).toBe('Round 3');
  });

  it('uses Round N labels for manual', async () => {
    const matches = [makeMatch(1, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'manual', PARTICIPANTS);
    expect(getRound(result.rounds, 0).label).toBe('Round 1');
  });
});

// ─── participant data in nodes ────────────────────────────────────────────────

describe('TournamentBracketService — participant data in match nodes', () => {
  it('populates participant1 with displayName and seed', async () => {
    const matches = [makeMatch(1, 1, { participant1Id: P1_OID, participant2Id: P2_OID })];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.participant1?.participantId).toBe(String(P1_OID));
    expect(node.participant1?.displayName).toBe('Player One');
    expect(node.participant1?.seed).toBe(1);
  });

  it('falls back to Participant when no participantDisplayName is set', async () => {
    const matches = [makeMatch(1, 1, { participant1Id: P3_OID })];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.participant1?.displayName).toBe('Participant');
  });

  it('does not expose userId in displayName for any participant', async () => {
    const matches = [makeMatch(1, 1, { participant1Id: P1_OID, participant2Id: P3_OID })];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.participant1?.displayName).not.toBe('user1');
    expect(node.participant2?.displayName).not.toBe('user3');
  });

  it('uses seed 0 for unseeded participants', async () => {
    const matches = [makeMatch(1, 1, { participant1Id: P4_OID })];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.participant1?.seed).toBe(0);
  });

  it('omits participant1 when not set on match', async () => {
    const matches = [makeMatch(1, 1)];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.participant1).toBeUndefined();
    expect(node.participant2).toBeUndefined();
  });

  it('includes winnerId when match is completed', async () => {
    const matches = [
      makeMatch(1, 1, {
        participant1Id: P1_OID,
        participant2Id: P2_OID,
        winnerId: P1_OID,
        status: 'completed',
      }),
    ];
    const { service } = makeService(matches);
    const result = await service.getBracket(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const node = getNode(result.rounds, 0, 0);
    expect(node.winnerId).toBe(String(P1_OID));
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRound(rounds: readonly BracketRoundDto[], index: number): BracketRoundDto {
  const round = rounds[index];
  if (!round) throw new Error(`Round at index ${index} does not exist`);
  return round;
}

function getNode(rounds: readonly BracketRoundDto[], roundIndex: number, matchIndex: number) {
  const round = getRound(rounds, roundIndex);
  const node = round.matches[matchIndex];
  if (!node) throw new Error(`Match at index ${matchIndex} does not exist`);
  return node;
}
