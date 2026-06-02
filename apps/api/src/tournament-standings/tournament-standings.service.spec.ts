import { TournamentStandingsService } from './tournament-standings.service';
import { Types } from 'mongoose';
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
    type: 'individual',
    ...overrides,
  } as unknown as TournamentRegistrationDocument;
}

function makeMatch(overrides: Partial<Record<string, unknown>> = {}): TournamentMatchDocument {
  return {
    _id: new Types.ObjectId(),
    tournamentId: TOURNAMENT_OID,
    round: 1,
    matchNumber: 1,
    status: 'completed',
    ...overrides,
  } as unknown as TournamentMatchDocument;
}

function makeService(completedMatches: TournamentMatchDocument[] = []) {
  const repoMock = {
    list: jest.fn().mockResolvedValue({ items: completedMatches, total: completedMatches.length }),
  };
  const service = new TournamentStandingsService(repoMock as never);
  return { service, repoMock };
}

const PARTICIPANTS = [
  makeParticipant(P1_OID, 'user1', { participantDisplayName: 'Player One' }),
  makeParticipant(P2_OID, 'user2', { participantDisplayName: 'Player Two' }),
  makeParticipant(P3_OID, 'user3'),
  makeParticipant(P4_OID, 'user4', { participantDisplayName: 'Player Four' }),
];

// ─── manual format ────────────────────────────────────────────────────────────

describe('TournamentStandingsService — manual format', () => {
  it('returns empty standings for manual format', async () => {
    const { service } = makeService();
    const result = await service.getStandings(TOURNAMENT_OID, 'manual', PARTICIPANTS);
    expect(result.standings).toHaveLength(0);
    expect(result.format).toBe('manual');
    expect(result.tournamentId).toBe(String(TOURNAMENT_OID));
  });

  it('does not query matches for manual format', async () => {
    const { service, repoMock } = makeService();
    await service.getStandings(TOURNAMENT_OID, 'manual', PARTICIPANTS);
    expect(repoMock.list).not.toHaveBeenCalled();
  });
});

// ─── round_robin standings ────────────────────────────────────────────────────

describe('TournamentStandingsService — round_robin', () => {
  it('assigns correct wins and losses', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: P1_OID }),
      makeMatch({
        participant1Id: P1_OID,
        participant2Id: P3_OID,
        winnerId: P3_OID,
        matchNumber: 2,
      }),
      makeMatch({
        participant1Id: P2_OID,
        participant2Id: P3_OID,
        winnerId: P2_OID,
        matchNumber: 3,
      }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const p1 = result.standings.find((s) => s.participantId === String(P1_OID))!;
    const p2 = result.standings.find((s) => s.participantId === String(P2_OID))!;
    const p3 = result.standings.find((s) => s.participantId === String(P3_OID))!;

    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(1);
    expect(p2.wins).toBe(1);
    expect(p2.losses).toBe(1);
    expect(p3.wins).toBe(1);
    expect(p3.losses).toBe(1);
  });

  it('applies round_robin points multiplier (wins * 3)', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: P1_OID }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const p1 = result.standings.find((s) => s.participantId === String(P1_OID))!;
    const p2 = result.standings.find((s) => s.participantId === String(P2_OID))!;

    expect(p1.points).toBe(3);
    expect(p2.points).toBe(0);
  });

  it('ranks by points descending', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: P1_OID }),
      makeMatch({
        participant1Id: P1_OID,
        participant2Id: P3_OID,
        winnerId: P1_OID,
        matchNumber: 2,
      }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const top = result.standings[0];
    expect(top?.participantId).toBe(String(P1_OID));
    expect(top?.rank).toBe(1);
  });

  it('all participants seeded with zero wins/losses even if no matches played', async () => {
    const { service } = makeService([]);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    expect(result.standings).toHaveLength(4);
    for (const s of result.standings) {
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.points).toBe(0);
    }
  });

  it('uses participantDisplayName when set', async () => {
    const { service } = makeService([]);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const p1 = result.standings.find((s) => s.participantId === String(P1_OID))!;
    expect(p1.displayName).toBe('Player One');
  });

  it('falls back to Participant when no participantDisplayName is set', async () => {
    const { service } = makeService([]);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    const p3 = result.standings.find((s) => s.participantId === String(P3_OID))!;
    expect(p3.displayName).toBe('Participant');
  });

  it('uses teamName as fallback for team participants without participantDisplayName', async () => {
    const teamParticipant = makeParticipant(P3_OID, 'user3', {
      type: 'team',
      teamName: 'The Dragons',
    });
    const { service } = makeService([]);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', [teamParticipant]);

    const p3 = result.standings.find((s) => s.participantId === String(P3_OID))!;
    expect(p3.displayName).toBe('The Dragons');
  });

  it('does not expose userId in displayName for any participant', async () => {
    const { service } = makeService([]);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    for (const standing of result.standings) {
      expect(standing.displayName).not.toBe('user1');
      expect(standing.displayName).not.toBe('user2');
      expect(standing.displayName).not.toBe('user3');
      expect(standing.displayName).not.toBe('user4');
    }
  });

  it('skips match without winnerId', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: undefined }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'round_robin', PARTICIPANTS);

    for (const s of result.standings) {
      expect(s.wins).toBe(0);
    }
  });
});

// ─── single_elimination standings ─────────────────────────────────────────────

describe('TournamentStandingsService — single_elimination', () => {
  it('applies points multiplier of 1 (not 3)', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: P1_OID }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const p1 = result.standings.find((s) => s.participantId === String(P1_OID))!;
    expect(p1.points).toBe(1);
  });

  it('winner ranks above loser', async () => {
    const matches = [
      makeMatch({ participant1Id: P1_OID, participant2Id: P2_OID, winnerId: P1_OID }),
    ];
    const { service } = makeService(matches);
    const result = await service.getStandings(TOURNAMENT_OID, 'single_elimination', PARTICIPANTS);

    const p1Rank = result.standings.find((s) => s.participantId === String(P1_OID))!.rank;
    const p2Rank = result.standings.find((s) => s.participantId === String(P2_OID))!.rank;
    expect(p1Rank).toBeLessThan(p2Rank);
  });
});

// ─── recalculate ──────────────────────────────────────────────────────────────

describe('TournamentStandingsService — recalculate', () => {
  it('returns success: true with tournamentId and recalculatedAt', async () => {
    const { service } = makeService([]);
    const result = await service.recalculate(
      TOURNAMENT_OID,
      'round_robin',
      PARTICIPANTS,
      'admin_1',
    );
    expect(result.success).toBe(true);
    expect(result.tournamentId).toBe(String(TOURNAMENT_OID));
    expect(result.recalculatedAt).toBeDefined();
  });

  it('succeeds for manual format (no match queries)', async () => {
    const { service, repoMock } = makeService([]);
    const result = await service.recalculate(TOURNAMENT_OID, 'manual', PARTICIPANTS, 'admin_1');
    expect(result.success).toBe(true);
    expect(repoMock.list).not.toHaveBeenCalled();
  });
});
