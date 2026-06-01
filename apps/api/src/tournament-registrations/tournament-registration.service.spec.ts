import { readFileSync } from 'fs';
import { join } from 'path';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TournamentRegistrationService } from './tournament-registration.service';
import type { TournamentRegistrationDocument } from './tournament-registration.schema';
import type { TournamentDocument } from '../tournaments/tournament.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TOURNAMENT_ID = '507f1f77bcf86cd799439011';
const USER_ID = 'user_abc123';
const REGISTRATION_ID = '507f1f77bcf86cd799439099';
const ADMIN_USER_ID = 'admin_xyz456';

function makeTournament(overrides: Partial<Record<string, unknown>> = {}): TournamentDocument {
  return {
    _id: TOURNAMENT_ID,
    title: 'Dragon Cup 2026',
    slug: 'dragon-cup-2026',
    slugNormalized: 'dragon-cup-2026',
    gameId: '507f1f77bcf86cd799439012',
    format: 'single_elimination',
    status: 'registration_open',
    participantType: 'individual',
    capacity: 64,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as TournamentDocument;
}

function makeRegistration(
  overrides: Partial<Record<string, unknown>> = {},
): TournamentRegistrationDocument {
  return {
    _id: REGISTRATION_ID,
    tournamentId: TOURNAMENT_ID,
    userId: USER_ID,
    type: 'individual',
    status: 'submitted',
    submittedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    ...overrides,
  } as unknown as TournamentRegistrationDocument;
}

// ─── Service setup ────────────────────────────────────────────────────────────

describe('TournamentRegistrationService', () => {
  let service: TournamentRegistrationService;
  let repoMock: {
    findById: jest.Mock;
    findByTournamentAndUser: jest.Mock;
    findBlockingRegistration: jest.Mock;
    countActive: jest.Mock;
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    repoMock = {
      findById: jest.fn().mockResolvedValue(null),
      findByTournamentAndUser: jest.fn().mockResolvedValue(null),
      findBlockingRegistration: jest.fn().mockResolvedValue(null),
      countActive: jest.fn().mockResolvedValue(0),
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      create: jest.fn().mockResolvedValue(makeRegistration()),
      update: jest.fn().mockResolvedValue(null),
    };
    service = new TournamentRegistrationService(repoMock as never);
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const baseInput = { type: 'individual' as const };

    it('creates a registration for registration_open individual tournament', async () => {
      const tournament = makeTournament();
      const reg = makeRegistration();
      repoMock.create.mockResolvedValue(reg);

      const result = await service.register(tournament, USER_ID, baseInput);
      expect(result).toBe(reg);
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          type: 'individual',
        }),
      );
    });

    it('throws UnprocessableEntityException when tournament status is not registration_open', async () => {
      const tournament = makeTournament({ status: 'published' });
      await expect(service.register(tournament, USER_ID, baseInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException when tournament is draft', async () => {
      const tournament = makeTournament({ status: 'draft' });
      await expect(service.register(tournament, USER_ID, baseInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws ConflictException when capacity is reached', async () => {
      repoMock.countActive.mockResolvedValue(64);
      const tournament = makeTournament({ capacity: 64 });
      await expect(service.register(tournament, USER_ID, baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows registration when capacity is not yet reached', async () => {
      repoMock.countActive.mockResolvedValue(63);
      repoMock.create.mockResolvedValue(makeRegistration());
      const tournament = makeTournament({ capacity: 64 });
      await expect(service.register(tournament, USER_ID, baseInput)).resolves.toBeDefined();
    });

    it('throws ConflictException when submitted registration already exists', async () => {
      repoMock.findBlockingRegistration.mockResolvedValue(
        makeRegistration({ status: 'submitted' }),
      );
      await expect(service.register(makeTournament(), USER_ID, baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when approved registration already exists', async () => {
      repoMock.findBlockingRegistration.mockResolvedValue(makeRegistration({ status: 'approved' }));
      await expect(service.register(makeTournament(), USER_ID, baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when rejected registration exists (conservative policy)', async () => {
      repoMock.findBlockingRegistration.mockResolvedValue(makeRegistration({ status: 'rejected' }));
      await expect(service.register(makeTournament(), USER_ID, baseInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows re-registration after withdrawal', async () => {
      repoMock.findBlockingRegistration.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(makeRegistration());
      await expect(service.register(makeTournament(), USER_ID, baseInput)).resolves.toBeDefined();
    });

    it('throws UnprocessableEntityException when individual tournament gets team registration', async () => {
      const tournament = makeTournament({ participantType: 'individual' });
      await expect(
        service.register(tournament, USER_ID, { type: 'team', teamName: 'My Team' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when team tournament gets individual registration', async () => {
      const tournament = makeTournament({ participantType: 'team' });
      await expect(service.register(tournament, USER_ID, { type: 'individual' })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('accepts both types in a "both" tournament', async () => {
      const tournament = makeTournament({ participantType: 'both' });
      repoMock.create.mockResolvedValue(makeRegistration());
      await expect(service.register(tournament, USER_ID, baseInput)).resolves.toBeDefined();
    });

    it('requires teamName for team registration', async () => {
      const tournament = makeTournament({ participantType: 'team' });
      await expect(service.register(tournament, USER_ID, { type: 'team' })).rejects.toThrow();
    });

    it('creates team registration with teamName and members', async () => {
      const tournament = makeTournament({ participantType: 'team' });
      const reg = makeRegistration({
        type: 'team',
        teamName: 'Dragons',
        members: [{ userId: 'u1', displayName: 'Player1' }],
      });
      repoMock.create.mockResolvedValue(reg);

      const result = await service.register(tournament, USER_ID, {
        type: 'team',
        teamName: 'Dragons',
        members: [{ userId: 'u1', displayName: 'Player1' }],
      });
      expect(result).toBe(reg);
    });

    it('silently ignores teamName/members for individual registration', async () => {
      const tournament = makeTournament({ participantType: 'individual' });
      repoMock.create.mockResolvedValue(makeRegistration());

      await service.register(tournament, USER_ID, {
        type: 'individual',
        teamName: 'should be ignored',
        members: [{ userId: 'u1', displayName: 'p1' }],
      } as never);

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ teamName: expect.anything() }),
      );
    });

    it('throws UnprocessableEntityException when registration window has closed', async () => {
      const tournament = makeTournament({
        registrationCloseAt: new Date('2025-01-01'),
      });
      await expect(service.register(tournament, USER_ID, baseInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException when registration has not opened yet', async () => {
      const tournament = makeTournament({
        registrationOpenAt: new Date('2099-01-01'),
      });
      await expect(service.register(tournament, USER_ID, baseInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws for invalid registration type', async () => {
      await expect(
        service.register(makeTournament(), USER_ID, { type: 'invalid' as never }),
      ).rejects.toThrow();
    });
  });

  // ─── findMyRegistration ───────────────────────────────────────────────────

  describe('findMyRegistration', () => {
    it('returns registration when found', async () => {
      const reg = makeRegistration();
      repoMock.findByTournamentAndUser.mockResolvedValue(reg);

      const result = await service.findMyRegistration(TOURNAMENT_ID, USER_ID);
      expect(result).toBe(reg);
      expect(repoMock.findByTournamentAndUser).toHaveBeenCalledWith(TOURNAMENT_ID, USER_ID);
    });

    it('returns null when not found', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(null);
      const result = await service.findMyRegistration(TOURNAMENT_ID, USER_ID);
      expect(result).toBeNull();
    });
  });

  // ─── updateMyRegistration ─────────────────────────────────────────────────

  describe('updateMyRegistration', () => {
    it('updates team registration teamName', async () => {
      const reg = makeRegistration({ type: 'team', teamName: 'Old Name', status: 'submitted' });
      const updated = makeRegistration({ type: 'team', teamName: 'New Name', status: 'submitted' });
      repoMock.findByTournamentAndUser.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(updated);

      const result = await service.updateMyRegistration(TOURNAMENT_ID, USER_ID, {
        teamName: 'New Name',
      });
      expect(result.teamName).toBe('New Name');
    });

    it('throws NotFoundException when no registration found', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(null);
      await expect(
        service.updateMyRegistration(TOURNAMENT_ID, USER_ID, { teamName: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException when registration is withdrawn', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(
        makeRegistration({ type: 'team', status: 'withdrawn' }),
      );
      await expect(
        service.updateMyRegistration(TOURNAMENT_ID, USER_ID, { teamName: 'x' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when registration is cancelled', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(
        makeRegistration({ type: 'team', status: 'cancelled' }),
      );
      await expect(
        service.updateMyRegistration(TOURNAMENT_ID, USER_ID, { teamName: 'x' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException for individual registration update', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(
        makeRegistration({ type: 'individual', status: 'submitted' }),
      );
      await expect(
        service.updateMyRegistration(TOURNAMENT_ID, USER_ID, { teamName: 'x' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('public update cannot change status — no status field in UpdateRegistrationInput', () => {
      // Verify at source level: UpdateRegistrationInput must not contain a status property.
      const src = readFileSync(join(__dirname, 'tournament-registration.types.ts'), 'utf8');
      const updateBlock =
        src.match(/export interface UpdateRegistrationInput \{[\s\S]*?\n\}/)?.[0] ?? '';
      expect(updateBlock).not.toContain('status');
    });
  });

  // ─── withdraw ─────────────────────────────────────────────────────────────

  describe('withdraw', () => {
    it('withdraws a submitted registration', async () => {
      const reg = makeRegistration({ status: 'submitted' });
      const withdrawn = makeRegistration({ status: 'withdrawn', withdrawnAt: new Date() });
      repoMock.findByTournamentAndUser.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(withdrawn);

      const result = await service.withdraw(TOURNAMENT_ID, USER_ID);
      expect(result.status).toBe('withdrawn');
      expect(repoMock.update).toHaveBeenCalledWith(
        reg._id,
        expect.objectContaining({ status: 'withdrawn', withdrawnAt: expect.any(Date) }),
      );
    });

    it('withdraws an approved registration', async () => {
      const reg = makeRegistration({ status: 'approved' });
      const withdrawn = makeRegistration({ status: 'withdrawn' });
      repoMock.findByTournamentAndUser.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(withdrawn);

      await service.withdraw(TOURNAMENT_ID, USER_ID);
      expect(repoMock.update).toHaveBeenCalledWith(
        reg._id,
        expect.objectContaining({ status: 'withdrawn' }),
      );
    });

    it('throws NotFoundException when no registration found', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(null);
      await expect(service.withdraw(TOURNAMENT_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException when already withdrawn', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(makeRegistration({ status: 'withdrawn' }));
      await expect(service.withdraw(TOURNAMENT_ID, USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException when already rejected', async () => {
      repoMock.findByTournamentAndUser.mockResolvedValue(makeRegistration({ status: 'rejected' }));
      await expect(service.withdraw(TOURNAMENT_ID, USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── approve ──────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('approves a submitted registration', async () => {
      const reg = makeRegistration({ status: 'submitted' });
      const approved = makeRegistration({ status: 'approved', approvedAt: new Date() });
      repoMock.findById.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(approved);

      const result = await service.approve(REGISTRATION_ID, ADMIN_USER_ID);
      expect(result.status).toBe('approved');
      expect(repoMock.update).toHaveBeenCalledWith(
        REGISTRATION_ID,
        expect.objectContaining({ status: 'approved', approvedAt: expect.any(Date) }),
      );
    });

    it('approves a waitlisted registration', async () => {
      const reg = makeRegistration({ status: 'waitlisted' });
      repoMock.findById.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(makeRegistration({ status: 'approved' }));

      await service.approve(REGISTRATION_ID, ADMIN_USER_ID);
      expect(repoMock.update).toHaveBeenCalledWith(
        REGISTRATION_ID,
        expect.objectContaining({ status: 'approved' }),
      );
    });

    it('throws NotFoundException when registration not found', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.approve(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException for invalid transition (rejected -> approved)', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'rejected' }));
      await expect(service.approve(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException for transition from withdrawn', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'withdrawn' }));
      await expect(service.approve(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── reject ───────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('rejects a submitted registration', async () => {
      const reg = makeRegistration({ status: 'submitted' });
      const rejected = makeRegistration({ status: 'rejected', rejectedAt: new Date() });
      repoMock.findById.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(rejected);

      const result = await service.reject(REGISTRATION_ID, ADMIN_USER_ID);
      expect(result.status).toBe('rejected');
      expect(repoMock.update).toHaveBeenCalledWith(
        REGISTRATION_ID,
        expect.objectContaining({ status: 'rejected', rejectedAt: expect.any(Date) }),
      );
    });

    it('stores rejection reason when provided', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'submitted' }));
      repoMock.update.mockResolvedValue(makeRegistration({ status: 'rejected' }));

      await service.reject(REGISTRATION_ID, ADMIN_USER_ID, 'Ineligible player');
      expect(repoMock.update).toHaveBeenCalledWith(
        REGISTRATION_ID,
        expect.objectContaining({ rejectedReason: 'Ineligible player' }),
      );
    });

    it('does not store rejection reason when not provided', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'submitted' }));
      repoMock.update.mockResolvedValue(makeRegistration({ status: 'rejected' }));

      await service.reject(REGISTRATION_ID, ADMIN_USER_ID);
      expect(repoMock.update).toHaveBeenCalledWith(
        REGISTRATION_ID,
        expect.not.objectContaining({ rejectedReason: expect.anything() }),
      );
    });

    it('throws NotFoundException when registration not found', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.reject(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException for illegal transition (cancelled -> rejected)', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'cancelled' }));
      await expect(service.reject(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('cancels a submitted registration', async () => {
      const reg = makeRegistration({ status: 'submitted' });
      const cancelled = makeRegistration({ status: 'cancelled', cancelledAt: new Date() });
      repoMock.findById.mockResolvedValue(reg);
      repoMock.update.mockResolvedValue(cancelled);

      const result = await service.cancel(REGISTRATION_ID, ADMIN_USER_ID);
      expect(result.status).toBe('cancelled');
    });

    it('throws NotFoundException when registration not found', async () => {
      repoMock.findById.mockResolvedValue(null);
      await expect(service.cancel(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException for cancelled -> cancelled', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'cancelled' }));
      await expect(service.cancel(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException for rejected -> cancelled', async () => {
      repoMock.findById.mockResolvedValue(makeRegistration({ status: 'rejected' }));
      await expect(service.cancel(REGISTRATION_ID, ADMIN_USER_ID)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ─── listForTournament ────────────────────────────────────────────────────

  describe('listForTournament', () => {
    it('delegates filter and pagination to repository', async () => {
      const reg = makeRegistration();
      repoMock.list.mockResolvedValue({ items: [reg], total: 1 });

      const result = await service.listForTournament(TOURNAMENT_ID, { status: 'submitted' }, 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repoMock.list).toHaveBeenCalledWith(
        expect.objectContaining({ tournamentId: TOURNAMENT_ID, status: 'submitted' }),
        1,
        20,
      );
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns registration when found', async () => {
      const reg = makeRegistration();
      repoMock.findById.mockResolvedValue(reg);
      expect(await service.findById(REGISTRATION_ID)).toBe(reg);
    });

    it('returns null when not found', async () => {
      repoMock.findById.mockResolvedValue(null);
      expect(await service.findById(REGISTRATION_ID)).toBeNull();
    });
  });
});
