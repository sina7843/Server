import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TournamentMatchService } from './tournament-match.service';
import type { TournamentMatchDocument } from './tournament-match.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TOURNAMENT_OID = new Types.ObjectId('507f1f77bcf86cd799439011');
const MATCH_ID = '507f1f77bcf86cd799439099';
const ADMIN_USER_ID = 'admin_xyz456';

function makeMatch(overrides: Partial<Record<string, unknown>> = {}): TournamentMatchDocument {
  return {
    _id: new Types.ObjectId(MATCH_ID),
    tournamentId: TOURNAMENT_OID,
    round: 1,
    matchNumber: 1,
    status: 'scheduled',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as TournamentMatchDocument;
}

// ─── Service setup ─────────────────────────────────────────────────────────────

function makeService() {
  const repoMock = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(makeMatch()),
    createMany: jest.fn().mockResolvedValue([]),
    patch: jest.fn().mockResolvedValue(makeMatch()),
    countByTournament: jest.fn().mockResolvedValue(0),
  };
  const service = new TournamentMatchService(repoMock as never);
  return { service, repoMock };
}

// ─── list ──────────────────────────────────────────────────────────────────────

describe('TournamentMatchService — listMatches', () => {
  it('delegates to repository with tournamentId and filter', async () => {
    const { service, repoMock } = makeService();
    repoMock.list.mockResolvedValueOnce({ items: [makeMatch()], total: 1, page: 1, limit: 20 });
    const result = await service.listMatches(TOURNAMENT_OID, { page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(repoMock.list).toHaveBeenCalledWith(TOURNAMENT_OID, { page: 1, limit: 20 });
  });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('TournamentMatchService — findById', () => {
  it('returns match when found for correct tournament', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch());
    const match = await service.findById(MATCH_ID, TOURNAMENT_OID);
    expect(String(match._id)).toBe(MATCH_ID);
  });

  it('throws NotFoundException when match is not found', async () => {
    const { service } = makeService();
    await expect(service.findById(MATCH_ID, TOURNAMENT_OID)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when match belongs to different tournament', async () => {
    const { service, repoMock } = makeService();
    const otherTournament = new Types.ObjectId();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ tournamentId: otherTournament }));
    await expect(service.findById(MATCH_ID, TOURNAMENT_OID)).rejects.toThrow(NotFoundException);
  });
});

// ─── createMatch ──────────────────────────────────────────────────────────────

describe('TournamentMatchService — createMatch', () => {
  it('calls repository.create and returns match', async () => {
    const { service, repoMock } = makeService();
    const input = { round: 1, matchNumber: 1 };
    await service.createMatch(TOURNAMENT_OID, input, ADMIN_USER_ID);
    expect(repoMock.create).toHaveBeenCalledWith(TOURNAMENT_OID, input);
  });
});

// ─── generateMatches ──────────────────────────────────────────────────────────

describe('TournamentMatchService — generateMatches', () => {
  it('throws BadRequestException when fewer than 2 participants', async () => {
    const { service } = makeService();
    await expect(
      service.generateMatches(
        TOURNAMENT_OID,
        'registration_closed',
        'single_elimination',
        [new Types.ObjectId()],
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for disallowed tournament status', async () => {
    const { service } = makeService();
    const participants = [new Types.ObjectId(), new Types.ObjectId()];
    await expect(
      service.generateMatches(
        TOURNAMENT_OID,
        'registration_open',
        'single_elimination',
        participants,
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for unsupported format (manual)', async () => {
    const { service } = makeService();
    const participants = [new Types.ObjectId(), new Types.ObjectId()];
    await expect(
      service.generateMatches(
        TOURNAMENT_OID,
        'registration_closed',
        'manual',
        participants,
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException when matches already exist', async () => {
    const { service, repoMock } = makeService();
    repoMock.countByTournament.mockResolvedValueOnce(3);
    const participants = [new Types.ObjectId(), new Types.ObjectId()];
    await expect(
      service.generateMatches(
        TOURNAMENT_OID,
        'registration_closed',
        'single_elimination',
        participants,
        ADMIN_USER_ID,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('calls createMany for single_elimination with 4 participants', async () => {
    const { service, repoMock } = makeService();
    repoMock.createMany.mockResolvedValueOnce([makeMatch(), makeMatch()]);
    const participants = Array.from({ length: 4 }, () => new Types.ObjectId());
    await service.generateMatches(
      TOURNAMENT_OID,
      'registration_closed',
      'single_elimination',
      participants,
      ADMIN_USER_ID,
    );
    const [, inputs] = repoMock.createMany.mock.calls[0];
    expect(inputs).toHaveLength(2);
  });

  it('calls createMany for round_robin with 4 participants (3 rounds, 2 matches each)', async () => {
    const { service, repoMock } = makeService();
    repoMock.createMany.mockResolvedValueOnce([]);
    const participants = Array.from({ length: 4 }, () => new Types.ObjectId());
    await service.generateMatches(
      TOURNAMENT_OID,
      'in_progress',
      'round_robin',
      participants,
      ADMIN_USER_ID,
    );
    const [, inputs] = repoMock.createMany.mock.calls[0];
    expect(inputs).toHaveLength(6);
  });
});

// ─── updateMatch ──────────────────────────────────────────────────────────────

describe('TournamentMatchService — updateMatch', () => {
  it('throws NotFoundException when match is not found', async () => {
    const { service } = makeService();
    await expect(
      service.updateMatch(MATCH_ID, TOURNAMENT_OID, { notes: 'test' }, ADMIN_USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when match is cancelled', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'cancelled' }));
    await expect(
      service.updateMatch(MATCH_ID, TOURNAMENT_OID, { notes: 'test' }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when match is completed', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'completed' }));
    await expect(
      service.updateMatch(MATCH_ID, TOURNAMENT_OID, { notes: 'test' }, ADMIN_USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('calls patch when match is in scheduled state', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'scheduled' }));
    repoMock.patch.mockResolvedValueOnce(makeMatch({ notes: 'updated' }));
    const result = await service.updateMatch(
      MATCH_ID,
      TOURNAMENT_OID,
      { notes: 'updated' },
      ADMIN_USER_ID,
    );
    expect(repoMock.patch).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

// ─── cancelMatch ──────────────────────────────────────────────────────────────

describe('TournamentMatchService — cancelMatch', () => {
  it('throws NotFoundException when match is not found', async () => {
    const { service } = makeService();
    await expect(service.cancelMatch(MATCH_ID, TOURNAMENT_OID, ADMIN_USER_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when match is already cancelled', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'cancelled' }));
    await expect(service.cancelMatch(MATCH_ID, TOURNAMENT_OID, ADMIN_USER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when match is completed', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'completed' }));
    await expect(service.cancelMatch(MATCH_ID, TOURNAMENT_OID, ADMIN_USER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sets status to cancelled for a scheduled match', async () => {
    const { service, repoMock } = makeService();
    repoMock.findById.mockResolvedValueOnce(makeMatch({ status: 'scheduled' }));
    repoMock.patch.mockResolvedValueOnce(makeMatch({ status: 'cancelled' }));
    const result = await service.cancelMatch(MATCH_ID, TOURNAMENT_OID, ADMIN_USER_ID);
    expect(repoMock.patch).toHaveBeenCalledWith(MATCH_ID, { status: 'cancelled' });
    expect(result.status).toBe('cancelled');
  });
});
