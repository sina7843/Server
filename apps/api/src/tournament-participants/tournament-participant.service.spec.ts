import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TournamentRegistration } from '../tournament-registrations/tournament-registration.schema';
import { TournamentParticipantService } from './tournament-participant.service';
import {
  deriveParticipantStatus,
  isParticipantActive,
  isRegistrationAParticipant,
} from './tournament-participant-policy';
import { toParticipantDto, toParticipantPublicDto } from './tournament-participant-projection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tournamentId = new Types.ObjectId().toHexString();
const userId = 'user-abc';

function makeReg(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(),
    tournamentId: new Types.ObjectId(tournamentId),
    userId,
    type: 'individual',
    status: 'approved',
    submittedAt: new Date(),
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Policy: deriveParticipantStatus ─────────────────────────────────────────

describe('deriveParticipantStatus', () => {
  it('approved with no overrides → active', () => {
    const doc = makeReg({ status: 'approved' });
    expect(deriveParticipantStatus(doc as never)).toBe('active');
  });

  it('approved + participantRemovedAt → removed', () => {
    const doc = makeReg({ status: 'approved', participantRemovedAt: new Date() });
    expect(deriveParticipantStatus(doc as never)).toBe('removed');
  });

  it('approved + participantDisqualifiedAt → disqualified', () => {
    const doc = makeReg({ status: 'approved', participantDisqualifiedAt: new Date() });
    expect(deriveParticipantStatus(doc as never)).toBe('disqualified');
  });

  it('withdrawn + approvedAt set → withdrawn', () => {
    const doc = makeReg({ status: 'withdrawn', approvedAt: new Date() });
    expect(deriveParticipantStatus(doc as never)).toBe('withdrawn');
  });

  it('removed takes priority over disqualified', () => {
    const doc = makeReg({
      status: 'approved',
      participantRemovedAt: new Date(),
      participantDisqualifiedAt: new Date(),
    });
    expect(deriveParticipantStatus(doc as never)).toBe('removed');
  });

  it('does not return eliminated (not a valid status)', () => {
    const doc = makeReg({ status: 'approved' });
    expect(deriveParticipantStatus(doc as never)).not.toBe('eliminated');
  });
});

// ─── Policy: isRegistrationAParticipant ──────────────────────────────────────

describe('isRegistrationAParticipant', () => {
  it('approved registration is a participant', () => {
    expect(isRegistrationAParticipant(makeReg({ status: 'approved' }) as never)).toBe(true);
  });

  it('withdrawn + approvedAt set is a participant (was approved, then withdrew)', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'withdrawn', approvedAt: new Date() }) as never),
    ).toBe(true);
  });

  it('submitted registration is NOT a participant', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'submitted', approvedAt: undefined }) as never),
    ).toBe(false);
  });

  it('rejected registration is NOT a participant', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'rejected', approvedAt: undefined }) as never),
    ).toBe(false);
  });

  it('waitlisted registration is NOT a participant', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'waitlisted', approvedAt: undefined }) as never),
    ).toBe(false);
  });

  it('cancelled registration is NOT a participant', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'cancelled', approvedAt: undefined }) as never),
    ).toBe(false);
  });

  it('withdrawn WITHOUT approvedAt is NOT a participant (was never approved)', () => {
    expect(
      isRegistrationAParticipant(makeReg({ status: 'withdrawn', approvedAt: null }) as never),
    ).toBe(false);
  });
});

// ─── Policy: isParticipantActive ─────────────────────────────────────────────

describe('isParticipantActive', () => {
  it('approved, no flags → active', () => {
    expect(isParticipantActive(makeReg({ status: 'approved' }) as never)).toBe(true);
  });

  it('approved + removed flag → not active', () => {
    expect(
      isParticipantActive(
        makeReg({ status: 'approved', participantRemovedAt: new Date() }) as never,
      ),
    ).toBe(false);
  });

  it('approved + disqualified flag → not active', () => {
    expect(
      isParticipantActive(
        makeReg({ status: 'approved', participantDisqualifiedAt: new Date() }) as never,
      ),
    ).toBe(false);
  });

  it('withdrawn → not active', () => {
    expect(isParticipantActive(makeReg({ status: 'withdrawn' }) as never)).toBe(false);
  });
});

// ─── Projection: toParticipantDto (admin) ─────────────────────────────────────

describe('toParticipantDto', () => {
  it('maps id, userId, status, displayName', () => {
    const doc = makeReg({ participantDisplayName: 'GamePlayer' });
    const dto = toParticipantDto(doc as never);
    expect(dto.id).toBe(String((doc as never as { _id: Types.ObjectId })._id));
    expect(dto.userId).toBe(userId);
    expect(dto.status).toBe('active');
    expect(dto.displayName).toBe('GamePlayer');
  });

  it('falls back to userId as displayName when participantDisplayName is absent', () => {
    const doc = makeReg();
    const dto = toParticipantDto(doc as never);
    expect(dto.displayName).toBe(userId);
  });

  it('includes seed when set', () => {
    const doc = makeReg({ seed: 3 });
    const dto = toParticipantDto(doc as never);
    expect(dto.seed).toBe(3);
  });

  it('omits seed when not set', () => {
    const doc = makeReg();
    const dto = toParticipantDto(doc as never);
    expect('seed' in dto).toBe(false);
  });

  it('includes teamName for team registrations', () => {
    const doc = makeReg({ teamName: 'Alpha Squad' });
    const dto = toParticipantDto(doc as never);
    expect(dto.teamName).toBe('Alpha Squad');
  });
});

// ─── Projection: toParticipantPublicDto ──────────────────────────────────────

describe('toParticipantPublicDto', () => {
  it('does not include userId (privacy-safe)', () => {
    const doc = makeReg();
    const dto = toParticipantPublicDto(doc as never);
    expect('userId' in dto).toBe(false);
  });

  it('does not include phone or email fields', () => {
    const doc = makeReg();
    const dto = toParticipantPublicDto(doc as never);
    const record = dto as unknown as Record<string, unknown>;
    expect(record['phone']).toBeUndefined();
    expect(record['email']).toBeUndefined();
    expect(record['contact']).toBeUndefined();
  });

  it('does not expose rejectedReason', () => {
    const doc = makeReg({ rejectedReason: 'internal note' });
    const dto = toParticipantPublicDto(doc as never);
    const record = dto as unknown as Record<string, unknown>;
    expect(record['rejectedReason']).toBeUndefined();
  });

  it('does not expose participantRemovedAt or participantDisqualifiedAt', () => {
    const doc = makeReg({ participantRemovedAt: new Date() });
    const dto = toParticipantPublicDto(doc as never);
    const record = dto as unknown as Record<string, unknown>;
    expect(record['participantRemovedAt']).toBeUndefined();
    expect(record['participantDisqualifiedAt']).toBeUndefined();
  });

  it('includes id, displayName, status', () => {
    const doc = makeReg({ participantDisplayName: 'Gamer' });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.id).toBeTruthy();
    expect(dto.displayName).toBe('Gamer');
    expect(dto.status).toBe('active');
  });
});

// ─── Service ─────────────────────────────────────────────────────────────────

describe('TournamentParticipantService', () => {
  let service: TournamentParticipantService;
  let modelMock: {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    countDocuments: jest.Mock;
  };

  function mockQuery(returnValue: unknown) {
    return { exec: jest.fn().mockResolvedValue(returnValue) };
  }

  beforeEach(async () => {
    modelMock = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TournamentParticipantService,
        {
          provide: getModelToken(TournamentRegistration.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get(TournamentParticipantService);
  });

  // ─── listParticipants ────────────────────────────────────────────────────

  describe('listParticipants', () => {
    it('returns approved registrations as active participants', async () => {
      const docs = [makeReg({ status: 'approved' })];
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery(docs) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(1));

      const result = await service.listParticipants(tournamentId, 'active');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('does not return submitted registrations (query excludes them)', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      const { items } = await service.listParticipants(tournamentId, 'active');
      // Verify find was called with approved status filter
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['status']).toBe('approved');
      expect(items).toHaveLength(0);
    });

    it('builds correct query for active filter', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      await service.listParticipants(tournamentId, 'active');
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['status']).toBe('approved');
      expect(query['participantRemovedAt']).toEqual({ $exists: false });
      expect(query['participantDisqualifiedAt']).toEqual({ $exists: false });
    });

    it('builds correct query for withdrawn filter', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      await service.listParticipants(tournamentId, 'withdrawn');
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['status']).toBe('withdrawn');
      expect(query['approvedAt']).toEqual({ $exists: true, $ne: null });
    });

    it('builds correct query for removed filter', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      await service.listParticipants(tournamentId, 'removed');
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['participantRemovedAt']).toEqual({ $exists: true, $ne: null });
    });

    it('builds correct query for disqualified filter', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      await service.listParticipants(tournamentId, 'disqualified');
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['participantDisqualifiedAt']).toEqual({ $exists: true, $ne: null });
    });

    it('no filter uses $or query covering approved and withdrawn-with-approvedAt', async () => {
      modelMock.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => mockQuery([]) }) }),
      });
      modelMock.countDocuments.mockReturnValue(mockQuery(0));

      await service.listParticipants(tournamentId);
      const query = modelMock.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(query['$or']).toBeDefined();
      const orClauses = query['$or'] as Array<Record<string, unknown>>;
      expect(orClauses.some((c) => c['status'] === 'approved')).toBe(true);
      expect(orClauses.some((c) => c['status'] === 'withdrawn')).toBe(true);
    });
  });

  // ─── findParticipant ─────────────────────────────────────────────────────

  describe('findParticipant', () => {
    it('returns null for non-approved, never-approved registration', async () => {
      const doc = makeReg({ status: 'submitted', approvedAt: undefined });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      const result = await service.findParticipant(String(doc._id), tournamentId);
      expect(result).toBeNull();
    });

    it('returns null when tournamentId does not match', async () => {
      const doc = makeReg({ status: 'approved' });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      const otherId = new Types.ObjectId().toHexString();
      const result = await service.findParticipant(String(doc._id), otherId);
      expect(result).toBeNull();
    });

    it('returns the document for approved registration', async () => {
      const doc = makeReg({ status: 'approved' });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      const result = await service.findParticipant(String(doc._id), tournamentId);
      expect(result).toBe(doc);
    });
  });

  // ─── removeParticipant ───────────────────────────────────────────────────

  describe('removeParticipant', () => {
    it('sets participantRemovedAt on active participant', async () => {
      const doc = makeReg({ status: 'approved' });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      modelMock.findByIdAndUpdate.mockReturnValue(mockQuery(doc));

      await expect(
        service.removeParticipant(String(doc._id), tournamentId, 'admin-1'),
      ).resolves.toBeUndefined();

      expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        String(doc._id),
        expect.objectContaining({
          $set: expect.objectContaining({ participantRemovedAt: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundException for non-participant registration', async () => {
      modelMock.findById.mockReturnValue(mockQuery(null));
      await expect(
        service.removeParticipant(new Types.ObjectId().toHexString(), tournamentId, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for already-removed participant', async () => {
      const doc = makeReg({ status: 'approved', participantRemovedAt: new Date() });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      await expect(
        service.removeParticipant(String(doc._id), tournamentId, 'admin-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException for already-disqualified participant', async () => {
      const doc = makeReg({ status: 'approved', participantDisqualifiedAt: new Date() });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      await expect(
        service.removeParticipant(String(doc._id), tournamentId, 'admin-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── disqualifyParticipant ───────────────────────────────────────────────

  describe('disqualifyParticipant', () => {
    it('sets participantDisqualifiedAt and returns updated document', async () => {
      const doc = makeReg({ status: 'approved' });
      const updated = { ...doc, participantDisqualifiedAt: new Date() };
      modelMock.findById.mockReturnValue(mockQuery(doc));
      modelMock.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      const result = await service.disqualifyParticipant(String(doc._id), tournamentId, 'admin-1');
      expect(result).toBe(updated);
      expect(modelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        String(doc._id),
        expect.objectContaining({
          $set: expect.objectContaining({ participantDisqualifiedAt: expect.any(Date) }),
        }),
        { new: true },
      );
    });

    it('throws NotFoundException for non-participant', async () => {
      modelMock.findById.mockReturnValue(mockQuery(null));
      await expect(
        service.disqualifyParticipant(new Types.ObjectId().toHexString(), tournamentId, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for withdrawn participant', async () => {
      const doc = makeReg({ status: 'withdrawn', approvedAt: new Date() });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      await expect(
        service.disqualifyParticipant(String(doc._id), tournamentId, 'admin-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── updateParticipant ───────────────────────────────────────────────────

  describe('updateParticipant', () => {
    it('updates seed and displayName for active participant', async () => {
      const doc = makeReg({ status: 'approved' });
      const updated = { ...doc, seed: 5, participantDisplayName: 'Renamed' };
      modelMock.findById.mockReturnValue(mockQuery(doc));
      modelMock.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      const result = await service.updateParticipant(String(doc._id), tournamentId, {
        seed: 5,
        displayName: 'Renamed',
      });
      expect(result).toBe(updated);
    });

    it('cannot change participant status via update', async () => {
      // The update input interface does not have a status field.
      // This is enforced at the type level — only seed and displayName are accepted.
      const doc = makeReg({ status: 'approved' });
      const updated = { ...doc };
      modelMock.findById.mockReturnValue(mockQuery(doc));
      modelMock.findByIdAndUpdate.mockReturnValue(mockQuery(updated));

      await service.updateParticipant(String(doc._id), tournamentId, { seed: 2 });
      const updateCall = modelMock.findByIdAndUpdate.mock.calls[0]?.[1] as {
        $set: Record<string, unknown>;
      };
      // $set must NOT contain status
      expect(updateCall.$set['status']).toBeUndefined();
    });

    it('throws UnprocessableEntityException for removed participant', async () => {
      const doc = makeReg({ status: 'approved', participantRemovedAt: new Date() });
      modelMock.findById.mockReturnValue(mockQuery(doc));
      await expect(
        service.updateParticipant(String(doc._id), tournamentId, { seed: 1 }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
