/**
 * Slice 9 backend guardrails — Public tournament participants endpoint.
 *
 * Permanent guardrails (never remove):
 *   - GET /api/v1/tournaments/:slug/participants is read-only and public-safe
 *   - No auth guard on public participants controller
 *   - No mutation methods (POST/PATCH/PUT/DELETE) on public controller
 *   - Public projection does not expose userId, phone, email, contact data
 *   - isPubliclyVisible gate enforced
 *   - No hardcoded localhost or qesb.ir
 *   - No fake/seed data
 *   - No public match detail API (:slug/matches/:matchId)
 */

import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TournamentRegistration } from '../tournament-registrations/tournament-registration.schema';
import { TournamentService } from '../tournaments/tournament.service';
import { TournamentParticipantService } from './tournament-participant.service';
import { PublicTournamentParticipantsController } from './public-tournament-participants.controller';
import {
  toParticipantPublicDto,
  toPublicParticipantListResponse,
} from './tournament-participant-projection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tournamentId = new Types.ObjectId().toHexString();

function makeReg(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(),
    tournamentId: new Types.ObjectId(tournamentId),
    userId: 'user-abc',
    type: 'individual',
    status: 'approved',
    participantDisplayName: 'Test Player',
    submittedAt: new Date(),
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTournament(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(tournamentId),
    slug: 'test-tournament',
    title: 'Test Tournament',
    status: 'registration_open',
    deletedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

// ─── Public projection safety ─────────────────────────────────────────────────

describe('toParticipantPublicDto — public-safe projection', () => {
  it('does not expose userId', () => {
    const doc = makeReg({ participantDisplayName: 'Alice', userId: 'user-secret-id' });
    const dto = toParticipantPublicDto(doc as never);
    expect((dto as unknown as Record<string, unknown>).userId).toBeUndefined();
  });

  it('uses participantDisplayName as displayName', () => {
    const doc = makeReg({ participantDisplayName: 'Alice' });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.displayName).toBe('Alice');
  });

  it('falls back to teamName if participantDisplayName is absent', () => {
    const doc = makeReg({ participantDisplayName: undefined, teamName: 'Team Alpha' });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.displayName).toBe('Team Alpha');
  });

  it('falls back to generic label if both displayName and teamName are absent', () => {
    const doc = makeReg({ participantDisplayName: undefined, teamName: undefined });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.displayName).toBe('Participant');
  });

  it('does not include userId even as fallback — never exposes userId in public DTO', () => {
    const doc = makeReg({
      participantDisplayName: undefined,
      teamName: undefined,
      userId: 'should-not-appear',
    });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.displayName).not.toBe('should-not-appear');
    expect(JSON.stringify(dto)).not.toContain('should-not-appear');
  });

  it('includes seed when set', () => {
    const doc = makeReg({ seed: 3 });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.seed).toBe(3);
  });

  it('includes teamName when set', () => {
    const doc = makeReg({ teamName: 'Team Alpha' });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.teamName).toBe('Team Alpha');
  });

  it('derives active status from approved registration with no overrides', () => {
    const doc = makeReg({ status: 'approved' });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.status).toBe('active');
  });

  it('derives removed status from participantRemovedAt', () => {
    const doc = makeReg({ participantRemovedAt: new Date() });
    const dto = toParticipantPublicDto(doc as never);
    expect(dto.status).toBe('removed');
  });
});

// ─── toPublicParticipantListResponse ─────────────────────────────────────────

describe('toPublicParticipantListResponse', () => {
  it('returns items, total, page, limit', () => {
    const docs = [makeReg(), makeReg()];
    const result = toPublicParticipantListResponse(docs as never, 5, 1, 20);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('items are public-safe (no userId)', () => {
    const docs = [makeReg({ userId: 'secret', participantDisplayName: 'Player' })];
    const result = toPublicParticipantListResponse(docs as never, 1, 1, 20);
    expect((result.items[0] as unknown as Record<string, unknown>).userId).toBeUndefined();
    expect(result.items[0]?.displayName).toBe('Player');
  });
});

// ─── Controller unit tests ────────────────────────────────────────────────────

describe('PublicTournamentParticipantsController', () => {
  let controller: PublicTournamentParticipantsController;
  let tournamentService: {
    findBySlug: jest.Mock;
  };
  let participantService: {
    listParticipants: jest.Mock;
  };

  beforeEach(async () => {
    tournamentService = { findBySlug: jest.fn() };
    participantService = { listParticipants: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [PublicTournamentParticipantsController],
      providers: [
        { provide: TournamentService, useValue: tournamentService },
        { provide: TournamentParticipantService, useValue: participantService },
        {
          provide: getModelToken(TournamentRegistration.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = moduleRef.get(PublicTournamentParticipantsController);
  });

  it('throws NotFoundException when tournament is not found', async () => {
    tournamentService.findBySlug.mockResolvedValue(null);
    await expect(controller.listParticipants('nonexistent')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException for non-public-visible tournament (draft)', async () => {
    tournamentService.findBySlug.mockResolvedValue(makeTournament({ status: 'draft' }));
    await expect(controller.listParticipants('draft-tournament')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException for archived tournament', async () => {
    tournamentService.findBySlug.mockResolvedValue(
      makeTournament({ status: 'published', archivedAt: new Date() }),
    );
    await expect(controller.listParticipants('archived-tournament')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns public-safe participant list for public tournament', async () => {
    const tournament = makeTournament({ status: 'registration_open' });
    tournamentService.findBySlug.mockResolvedValue(tournament);
    const reg = makeReg({ participantDisplayName: 'Alice' });
    participantService.listParticipants.mockResolvedValue({ items: [reg], total: 1 });

    const result = await controller.listParticipants('test-tournament');
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.displayName).toBe('Alice');
    expect((result.items[0] as unknown as Record<string, unknown>).userId).toBeUndefined();
  });

  it('returns empty list when no participants', async () => {
    const tournament = makeTournament({ status: 'in_progress' });
    tournamentService.findBySlug.mockResolvedValue(tournament);
    participantService.listParticipants.mockResolvedValue({ items: [], total: 0 });

    const result = await controller.listParticipants('test-tournament');
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('uses default pagination when no query params provided', async () => {
    const tournament = makeTournament({ status: 'in_progress' });
    tournamentService.findBySlug.mockResolvedValue(tournament);
    participantService.listParticipants.mockResolvedValue({ items: [], total: 0 });

    await controller.listParticipants('test-tournament');
    expect(participantService.listParticipants).toHaveBeenCalledWith(
      tournament._id,
      undefined,
      1,
      20,
    );
  });

  it('clamps limit to MAX_LIMIT of 100', async () => {
    const tournament = makeTournament({ status: 'in_progress' });
    tournamentService.findBySlug.mockResolvedValue(tournament);
    participantService.listParticipants.mockResolvedValue({ items: [], total: 0 });

    await controller.listParticipants('test-tournament', '1', '9999');
    const [, , , limitArg] = participantService.listParticipants.mock.calls[0] as [
      unknown,
      unknown,
      number,
      number,
    ];
    expect(limitArg).toBeLessThanOrEqual(100);
  });
});
