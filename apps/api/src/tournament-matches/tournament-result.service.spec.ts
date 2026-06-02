import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TournamentResultService } from './tournament-result.service';
import type { TournamentMatchDocument } from './tournament-match.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TOURNAMENT_OID = new Types.ObjectId('507f1f77bcf86cd799439011');
const MATCH_ID = '507f1f77bcf86cd799439099';
const ADMIN_USER_ID = 'admin_xyz456';

const P1_OID = new Types.ObjectId('507f1f77bcf86cd799439001');
const P2_OID = new Types.ObjectId('507f1f77bcf86cd799439002');
const OTHER_OID = new Types.ObjectId('507f1f77bcf86cd799439003');

function makeMatch(overrides: Partial<Record<string, unknown>> = {}): TournamentMatchDocument {
  return {
    _id: new Types.ObjectId(MATCH_ID),
    tournamentId: TOURNAMENT_OID,
    round: 1,
    matchNumber: 1,
    status: 'scheduled',
    participant1Id: P1_OID,
    participant2Id: P2_OID,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as TournamentMatchDocument;
}

function makeService() {
  const repoMock = {
    findById: jest.fn().mockResolvedValue(makeMatch()),
    patch: jest.fn().mockImplementation(async (_id: string, patch: Record<string, unknown>) => ({
      ...makeMatch(),
      ...patch,
    })),
  };
  const service = new TournamentResultService(repoMock as never);
  return { service, repoMock };
}

// ─── record ───────────────────────────────────────────────────────────────────

describe('TournamentResultService — record', () => {
  it('throws BadRequestException when tournament is not in_progress', async () => {
    const { service } = makeService();
    await expect(
      service.record(
        MATCH_ID,
        TOURNAMENT_OID,
        'registration_open',
        { winnerId: P1_OID },
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when match is not found', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(null);
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when match belongs to different tournament', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ tournamentId: new Types.ObjectId() }));
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when match is already completed', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'completed' }));
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when match is cancelled', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'cancelled' }));
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when participant1Id is missing', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ participant1Id: undefined }));
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when participant2Id is missing', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ participant2Id: undefined }));
    await expect(
      service.record(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when winner is not a participant', async () => {
    const { service } = makeService();
    await expect(
      service.record(
        MATCH_ID,
        TOURNAMENT_OID,
        'in_progress',
        { winnerId: OTHER_OID },
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('records result with participant1Id as winner', async () => {
    const { service, repoMock } = makeService();
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P1_OID,
        resultRecordedAt: new Date(),
        completedAt: new Date(),
      }),
    );
    const result = await service.record(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P1_OID },
      ADMIN_USER_ID,
    );
    expect(result.winnerId).toBe(String(P1_OID));
    expect(result.matchId).toBe(MATCH_ID);
    expect(result.tournamentId).toBe(String(TOURNAMENT_OID));
  });

  it('records result with participant2Id as winner', async () => {
    const { service, repoMock } = makeService();
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P2_OID,
        resultRecordedAt: new Date(),
        completedAt: new Date(),
      }),
    );
    const result = await service.record(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P2_OID },
      ADMIN_USER_ID,
    );
    expect(result.winnerId).toBe(String(P2_OID));
  });

  it('patches match with status=completed and winnerId', async () => {
    const { service, repoMock } = makeService();
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P1_OID,
        resultRecordedAt: new Date(),
        completedAt: new Date(),
      }),
    );
    await service.record(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P1_OID, participant1Score: 2, participant2Score: 1 },
      ADMIN_USER_ID,
    );
    const [, patch] = repoMock.patch.mock.calls[0] as [string, Record<string, unknown>];
    expect(patch.status).toBe('completed');
    expect(String(patch.winnerId)).toBe(String(P1_OID));
    expect(patch.participant1Score).toBe(2);
    expect(patch.participant2Score).toBe(1);
  });

  it('includes optional scores in result DTO', async () => {
    const { service, repoMock } = makeService();
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P1_OID,
        participant1Score: 3,
        participant2Score: 0,
        resultRecordedAt: new Date(),
        completedAt: new Date(),
      }),
    );
    const result = await service.record(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P1_OID, participant1Score: 3, participant2Score: 0 },
      ADMIN_USER_ID,
    );
    expect(result.participant1Score).toBe(3);
    expect(result.participant2Score).toBe(0);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('TournamentResultService — update', () => {
  it('throws BadRequestException when tournament is not in_progress', async () => {
    const { service } = makeService();
    await expect(
      service.update(MATCH_ID, TOURNAMENT_OID, 'completed', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when match is not completed (no result to update)', async () => {
    const { service } = makeService();
    await expect(
      service.update(MATCH_ID, TOURNAMENT_OID, 'in_progress', { winnerId: P1_OID }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when winner is not a participant', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'completed', winnerId: P1_OID }));
    await expect(
      service.update(
        MATCH_ID,
        TOURNAMENT_OID,
        'in_progress',
        { winnerId: OTHER_OID },
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates result and returns updated DTO', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(
      makeMatch({ status: 'completed', winnerId: P1_OID, resultRecordedAt: new Date() }),
    );
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P2_OID,
        resultRecordedAt: new Date(),
        completedAt: new Date(),
      }),
    );
    const result = await service.update(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P2_OID },
      ADMIN_USER_ID,
    );
    expect(result.winnerId).toBe(String(P2_OID));
  });

  it('does not update resultRecordedAt when updating', async () => {
    const { service, repoMock } = makeService();
    const originalDate = new Date('2026-01-01');
    repoMock.findById.mockResolvedValueOnce(
      makeMatch({ status: 'completed', winnerId: P1_OID, resultRecordedAt: originalDate }),
    );
    repoMock.patch.mockResolvedValueOnce(
      makeMatch({
        status: 'completed',
        winnerId: P2_OID,
        resultRecordedAt: originalDate,
        completedAt: new Date(),
      }),
    );
    await service.update(
      MATCH_ID,
      TOURNAMENT_OID,
      'in_progress',
      { winnerId: P2_OID },
      ADMIN_USER_ID,
    );
    const [, patch] = repoMock.patch.mock.calls[0] as [string, Record<string, unknown>];
    expect(patch).not.toHaveProperty('resultRecordedAt');
  });
});

// ─── void ─────────────────────────────────────────────────────────────────────

describe('TournamentResultService — void', () => {
  it('throws BadRequestException when tournament is not in_progress', async () => {
    const { service } = makeService();
    await expect(
      service.void(MATCH_ID, TOURNAMENT_OID, 'registration_closed', ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when match is not completed (no result to void)', async () => {
    const { service } = makeService();
    await expect(
      service.void(MATCH_ID, TOURNAMENT_OID, 'in_progress', ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('patches match with status=scheduled and clears result fields', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(
      makeMatch({ status: 'completed', winnerId: P1_OID, completedAt: new Date() }),
    );
    repoMock.patch.mockResolvedValueOnce(makeMatch({ status: 'scheduled' }));
    await service.void(MATCH_ID, TOURNAMENT_OID, 'in_progress', ADMIN_USER_ID);
    const [, patch] = repoMock.patch.mock.calls[0] as [string, Record<string, unknown>];
    expect(patch.status).toBe('scheduled');
    expect(patch.winnerId).toBeNull();
    expect(patch.completedAt).toBeNull();
    expect(patch.participant1Score).toBeNull();
    expect(patch.participant2Score).toBeNull();
    expect(patch.resultNotes).toBeNull();
    expect(patch.resultRecordedAt).toBeNull();
  });

  it('returns void (no return value)', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'completed', winnerId: P1_OID }));
    repoMock.patch.mockResolvedValueOnce(makeMatch({ status: 'scheduled' }));
    const result = await service.void(MATCH_ID, TOURNAMENT_OID, 'in_progress', ADMIN_USER_ID);
    expect(result).toBeUndefined();
  });
});
