import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { AdminTournamentsController } from './admin-tournaments.controller';
import { TournamentService } from '../../tournaments/tournament.service';
import { Permissions } from '../../rbac/registry/permission-keys';
import { PERMISSION_METADATA_KEY } from '../../rbac/decorators/permission-metadata';
import type { TournamentDocument } from '../../tournaments/tournament.schema';
import type { PermissionMetadata } from '../../rbac/decorators/permission-metadata';

function makeTournament(overrides: Partial<Record<string, unknown>> = {}): TournamentDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    title: 'Dragon Cup 2026',
    slug: 'dragon-cup-2026',
    slugNormalized: 'dragon-cup-2026',
    format: 'single_elimination',
    status: 'draft',
    participantType: 'individual',
    capacity: 64,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  } as unknown as TournamentDocument;
}

function makeRequest(userId?: string) {
  return { auth: userId ? { userId } : undefined } as never;
}

function getPermissionMetadata(handler: object): PermissionMetadata | undefined {
  return Reflect.getMetadata(PERMISSION_METADATA_KEY, handler) as PermissionMetadata | undefined;
}

// ─── Permission decorators ─────────────────────────────────────────────────────

describe('AdminTournamentsController — permission decorators', () => {
  it('listTournaments requires TOURNAMENT_READ', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.listTournaments);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_READ);
  });

  it('getTournament requires TOURNAMENT_READ', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.getTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_READ);
  });

  it('createTournament requires TOURNAMENT_CREATE', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.createTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_CREATE);
  });

  it('updateTournament requires TOURNAMENT_UPDATE', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.updateTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_UPDATE);
  });

  it('deleteTournament requires TOURNAMENT_ARCHIVE', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.deleteTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_ARCHIVE);
  });

  it('publishTournament requires TOURNAMENT_PUBLISH', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.publishTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
  });

  it('openRegistration requires TOURNAMENT_PUBLISH', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.openRegistration);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
  });

  it('closeRegistration requires TOURNAMENT_PUBLISH', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.closeRegistration);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
  });

  it('startTournament requires TOURNAMENT_PUBLISH', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.startTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
  });

  it('completeTournament requires TOURNAMENT_PUBLISH', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.completeTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_PUBLISH);
  });

  it('cancelTournament requires TOURNAMENT_CANCEL', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.cancelTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_CANCEL);
  });

  it('archiveTournament requires TOURNAMENT_ARCHIVE', () => {
    const metadata = getPermissionMetadata(AdminTournamentsController.prototype.archiveTournament);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_ARCHIVE);
  });
});

// ─── listTournaments ───────────────────────────────────────────────────────────

describe('AdminTournamentsController — listTournaments', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = { list: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('returns paginated list with correct shape', async () => {
    const t = makeTournament();
    (tournamentService.list as jest.Mock).mockResolvedValue({ items: [t], total: 1 });

    const result = await controller.listTournaments('1', '20');

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('uses default page and limit when not provided', async () => {
    await controller.listTournaments();

    expect(tournamentService.list).toHaveBeenCalledWith(expect.any(Object), 1, 20);
  });

  it('filters by status when a valid status is provided', async () => {
    await controller.listTournaments('1', '20', undefined, 'published');

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
      1,
      20,
    );
  });

  it('ignores invalid status values and omits status from filter', async () => {
    await controller.listTournaments('1', '20', undefined, 'open');

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('status');
  });

  it('filters by format when a valid format is provided', async () => {
    await controller.listTournaments('1', '20', undefined, undefined, 'round_robin');

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'round_robin' }),
      1,
      20,
    );
  });

  it('ignores invalid format values', async () => {
    await controller.listTournaments('1', '20', undefined, undefined, 'swiss');

    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('format');
  });

  it('filters by gameId when provided', async () => {
    await controller.listTournaments('1', '20', '507f1f77bcf86cd799439012');

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: '507f1f77bcf86cd799439012' }),
      1,
      20,
    );
  });

  it('passes registrationOpen: true when rawRegistrationOpen is "true"', async () => {
    await controller.listTournaments('1', '20', undefined, undefined, undefined, 'true');

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: true }),
      1,
      20,
    );
  });

  it('passes registrationOpen: false when rawRegistrationOpen is "false"', async () => {
    await controller.listTournaments('1', '20', undefined, undefined, undefined, 'false');

    expect(tournamentService.list).toHaveBeenCalledWith(
      expect.objectContaining({ registrationOpen: false }),
      1,
      20,
    );
  });

  it('omits registrationOpen when not provided', async () => {
    await controller.listTournaments('1', '20');

    expect(tournamentService.list).toHaveBeenCalled();
    const callFilter = (tournamentService.list as jest.Mock).mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callFilter).not.toHaveProperty('registrationOpen');
  });

  it('throws BadRequestException for invalid registrationOpen value', async () => {
    await expect(
      controller.listTournaments('1', '20', undefined, undefined, undefined, 'yes'),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for registrationOpen=1', async () => {
    await expect(
      controller.listTournaments('1', '20', undefined, undefined, undefined, '1'),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── getTournament ─────────────────────────────────────────────────────────────

describe('AdminTournamentsController — getTournament', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = { findById: jest.fn().mockResolvedValue(null) };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('returns TournamentDto for an existing tournament', async () => {
    (tournamentService.findById as jest.Mock).mockResolvedValue(makeTournament());

    const result = await controller.getTournament('507f1f77bcf86cd799439011');

    expect(result.id).toBe('507f1f77bcf86cd799439011');
    expect(result.title).toBe('Dragon Cup 2026');
    expect(result.format).toBe('single_elimination');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('throws NotFoundException for a non-existent tournament', async () => {
    (tournamentService.findById as jest.Mock).mockResolvedValue(null);

    await expect(controller.getTournament('507f1f77bcf86cd799439011')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException for an invalid ObjectId', async () => {
    await expect(controller.getTournament('not-an-id')).rejects.toThrow(BadRequestException);
  });

  it('returned TournamentDto does not include deletedAt or slugNormalized', async () => {
    (tournamentService.findById as jest.Mock).mockResolvedValue(
      makeTournament({ deletedAt: new Date() }),
    );

    const result = await controller.getTournament('507f1f77bcf86cd799439011');

    expect(result).not.toHaveProperty('deletedAt');
    expect(result).not.toHaveProperty('slugNormalized');
  });

  it('returned TournamentDto includes cancelledAt and archivedAt when set', async () => {
    const cancelledAt = new Date('2026-05-01T00:00:00Z');
    const archivedAt = new Date('2026-06-01T00:00:00Z');
    (tournamentService.findById as jest.Mock).mockResolvedValue(
      makeTournament({ cancelledAt, archivedAt }),
    );

    const result = await controller.getTournament('507f1f77bcf86cd799439011');

    expect(result.cancelledAt).toBe('2026-05-01T00:00:00.000Z');
    expect(result.archivedAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('returned TournamentDto includes participantType when set', async () => {
    (tournamentService.findById as jest.Mock).mockResolvedValue(
      makeTournament({ participantType: 'team' }),
    );

    const result = await controller.getTournament('507f1f77bcf86cd799439011');

    expect(result.participantType).toBe('team');
  });

  it('returned TournamentDto omits participantType when not set on document', async () => {
    (tournamentService.findById as jest.Mock).mockResolvedValue(
      makeTournament({ participantType: undefined }),
    );

    const result = await controller.getTournament('507f1f77bcf86cd799439011');

    expect('participantType' in result).toBe(false);
  });
});

// ─── createTournament ──────────────────────────────────────────────────────────

describe('AdminTournamentsController — createTournament', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    tournamentService = {
      create: jest.fn().mockResolvedValue(makeTournament()),
    };
    auditMock = { log: jest.fn() };
    controller = new AdminTournamentsController(
      tournamentService as unknown as TournamentService,
      auditMock as never,
    );
  });

  it('creates a tournament and returns TournamentDto', async () => {
    const result = await controller.createTournament(
      {
        gameId: '507f1f77bcf86cd799439012',
        title: 'Dragon Cup 2026',
        slug: 'dragon-cup-2026',
        format: 'single_elimination',
        capacity: 64,
      },
      makeRequest('admin1'),
    );

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Dragon Cup 2026');
    expect(result.format).toBe('single_elimination');
  });

  it('fires audit log after successful create', async () => {
    await controller.createTournament(
      {
        gameId: '507f1f77bcf86cd799439012',
        title: 'Dragon Cup 2026',
        slug: 'dragon-cup-2026',
        format: 'single_elimination',
        capacity: 64,
      },
      makeRequest('admin1'),
    );

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        action: 'tournament.created',
        resourceType: 'tournament',
        severity: 'info',
      }),
    );
  });

  it('throws BadRequestException when required fields are missing', async () => {
    await expect(
      controller.createTournament({ title: 'Dragon Cup', slug: 'dc' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for unknown fields in body', async () => {
    await expect(
      controller.createTournament(
        {
          gameId: 'g1',
          title: 'Cup',
          slug: 'cup',
          format: 'manual',
          capacity: 32,
          unknownField: 'x',
        },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when status is passed in body (lifecycle bypass)', async () => {
    await expect(
      controller.createTournament(
        {
          gameId: 'g1',
          title: 'Cup',
          slug: 'cup',
          format: 'manual',
          capacity: 32,
          status: 'published',
        },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('propagates ConflictException when slug is taken', async () => {
    (tournamentService.create as jest.Mock).mockRejectedValue(
      new ConflictException('Tournament slug "dragon-cup-2026" is already taken.'),
    );

    await expect(
      controller.createTournament(
        {
          gameId: 'g1',
          title: 'Cup',
          slug: 'dragon-cup-2026',
          format: 'manual',
          capacity: 32,
        },
        makeRequest(),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('propagates UnprocessableEntityException from service (e.g. invalid format)', async () => {
    (tournamentService.create as jest.Mock).mockRejectedValue(
      new UnprocessableEntityException('Unsupported format.'),
    );

    await expect(
      controller.createTournament(
        {
          gameId: 'g1',
          title: 'Cup',
          slug: 'cup',
          format: 'round_robin',
          capacity: 32,
        },
        makeRequest(),
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});

// ─── updateTournament ──────────────────────────────────────────────────────────

describe('AdminTournamentsController — updateTournament', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    tournamentService = {
      update: jest.fn().mockResolvedValue(makeTournament({ title: 'Updated Cup' })),
    };
    auditMock = { log: jest.fn() };
    controller = new AdminTournamentsController(
      tournamentService as unknown as TournamentService,
      auditMock as never,
    );
  });

  it('updates a tournament and returns updated TournamentDto', async () => {
    const result = await controller.updateTournament(
      '507f1f77bcf86cd799439011',
      { title: 'Updated Cup' },
      makeRequest('admin1'),
    );

    expect(result.title).toBe('Updated Cup');
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(
      controller.updateTournament('bad-id', { title: 'Cup' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for unknown body fields', async () => {
    await expect(
      controller.updateTournament('507f1f77bcf86cd799439011', { unknownField: 'x' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when status is in PATCH body (lifecycle bypass prevention)', async () => {
    await expect(
      controller.updateTournament(
        '507f1f77bcf86cd799439011',
        { status: 'published' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when publishedAt is in PATCH body', async () => {
    await expect(
      controller.updateTournament(
        '507f1f77bcf86cd799439011',
        { publishedAt: '2026-01-01T00:00:00Z' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when cancelledAt is in PATCH body', async () => {
    await expect(
      controller.updateTournament(
        '507f1f77bcf86cd799439011',
        { cancelledAt: '2026-01-01T00:00:00Z' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when archivedAt is in PATCH body', async () => {
    await expect(
      controller.updateTournament(
        '507f1f77bcf86cd799439011',
        { archivedAt: '2026-01-01T00:00:00Z' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when deletedAt is in PATCH body (soft-delete bypass prevention)', async () => {
    await expect(
      controller.updateTournament(
        '507f1f77bcf86cd799439011',
        { deletedAt: '2026-01-01T00:00:00Z' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('fires audit log after successful update', async () => {
    await controller.updateTournament(
      '507f1f77bcf86cd799439011',
      { title: 'Updated Cup' },
      makeRequest('admin1'),
    );

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        action: 'tournament.updated',
        severity: 'info',
      }),
    );
  });

  it('propagates NotFoundException when tournament is not found', async () => {
    (tournamentService.update as jest.Mock).mockRejectedValue(
      new NotFoundException('Tournament not found.'),
    );

    await expect(
      controller.updateTournament('507f1f77bcf86cd799439011', { title: 'Cup' }, makeRequest()),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── deleteTournament ──────────────────────────────────────────────────────────

describe('AdminTournamentsController — deleteTournament', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    tournamentService = {
      softDelete: jest.fn().mockResolvedValue(makeTournament({ deletedAt: new Date() })),
    };
    auditMock = { log: jest.fn() };
    controller = new AdminTournamentsController(
      tournamentService as unknown as TournamentService,
      auditMock as never,
    );
  });

  it('soft-deletes a tournament and returns success response', async () => {
    const result = await controller.deleteTournament(
      '507f1f77bcf86cd799439011',
      makeRequest('admin1'),
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe('Tournament deleted.');
    expect(tournamentService.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(controller.deleteTournament('not-valid', makeRequest())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException when tournament does not exist', async () => {
    (tournamentService.softDelete as jest.Mock).mockRejectedValue(
      new NotFoundException('Tournament not found.'),
    );

    await expect(
      controller.deleteTournament('507f1f77bcf86cd799439011', makeRequest()),
    ).rejects.toThrow(NotFoundException);
  });

  it('fires audit log with warning severity after delete', async () => {
    await controller.deleteTournament('507f1f77bcf86cd799439011', makeRequest('admin1'));

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        action: 'tournament.deleted',
        severity: 'warning',
      }),
    );
  });
});

// ─── Lifecycle: publish ────────────────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: publish', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'published' })),
    };
    auditMock = { log: jest.fn() };
    controller = new AdminTournamentsController(
      tournamentService as unknown as TournamentService,
      auditMock as never,
    );
  });

  it('calls transition with "published" and returns TournamentDto', async () => {
    const result = await controller.publishTournament(
      '507f1f77bcf86cd799439011',
      {},
      makeRequest('admin1'),
    );

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'published',
    );
    expect(result.status).toBe('published');
  });

  it('fires audit log with TOURNAMENT_PUBLISHED action', async () => {
    await controller.publishTournament('507f1f77bcf86cd799439011', {}, makeRequest('admin1'));

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tournament.published',
        severity: 'info',
      }),
    );
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(controller.publishTournament('bad-id', {}, makeRequest())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('propagates UnprocessableEntityException for invalid transition', async () => {
    (tournamentService.transition as jest.Mock).mockRejectedValue(
      new UnprocessableEntityException('Transition not allowed.'),
    );

    await expect(
      controller.publishTournament('507f1f77bcf86cd799439011', {}, makeRequest()),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});

// ─── Lifecycle: openRegistration ──────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: openRegistration', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'registration_open' })),
    };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('calls transition with "registration_open"', async () => {
    await controller.openRegistration('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'registration_open',
    );
  });

  it('returns tournament with registration_open status', async () => {
    const result = await controller.openRegistration('507f1f77bcf86cd799439011', {}, makeRequest());
    expect(result.status).toBe('registration_open');
  });
});

// ─── Lifecycle: closeRegistration ─────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: closeRegistration', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'registration_closed' })),
    };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('calls transition with "registration_closed"', async () => {
    await controller.closeRegistration('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'registration_closed',
    );
  });
});

// ─── Lifecycle: start ─────────────────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: start', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'in_progress' })),
    };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('calls transition with "in_progress"', async () => {
    await controller.startTournament('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'in_progress',
    );
  });
});

// ─── Lifecycle: complete ──────────────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: complete', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'completed' })),
    };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('calls transition with "completed"', async () => {
    await controller.completeTournament('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'completed',
    );
  });
});

// ─── Lifecycle: cancel ────────────────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: cancel', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'cancelled' })),
    };
    auditMock = { log: jest.fn() };
    controller = new AdminTournamentsController(
      tournamentService as unknown as TournamentService,
      auditMock as never,
    );
  });

  it('calls transition with "cancelled"', async () => {
    await controller.cancelTournament('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'cancelled',
    );
  });

  it('fires audit log with warning severity', async () => {
    await controller.cancelTournament('507f1f77bcf86cd799439011', {}, makeRequest('admin1'));

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tournament.cancelled',
        severity: 'warning',
      }),
    );
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(controller.cancelTournament('bad-id', {}, makeRequest())).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── Lifecycle: archive ───────────────────────────────────────────────────────

describe('AdminTournamentsController — lifecycle: archive', () => {
  let controller: AdminTournamentsController;
  let tournamentService: jest.Mocked<Partial<TournamentService>>;

  beforeEach(() => {
    tournamentService = {
      transition: jest.fn().mockResolvedValue(makeTournament({ status: 'archived' })),
    };
    controller = new AdminTournamentsController(tournamentService as unknown as TournamentService);
  });

  it('calls transition with "archived"', async () => {
    await controller.archiveTournament('507f1f77bcf86cd799439011', {}, makeRequest());

    expect(tournamentService.transition).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'archived',
    );
  });

  it('returns tournament with archived status', async () => {
    const result = await controller.archiveTournament(
      '507f1f77bcf86cd799439011',
      {},
      makeRequest(),
    );
    expect(result.status).toBe('archived');
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('AdminTournamentsController — scope guardrails', () => {
  it('controller source has no bracket references', () => {
    const src = fs.readFileSync(path.join(__dirname, 'admin-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/bracket|Bracket/);
  });

  it('controller source has no hardcoded localhost or qesb.ir', () => {
    const src = fs.readFileSync(path.join(__dirname, 'admin-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/localhost|qesb\.ir/);
  });

  it('controller source has no prize, payment, shop, or streaming references', () => {
    const src = fs.readFileSync(path.join(__dirname, 'admin-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/prize|payment|shop|stream/i);
  });

  it('controller source has no fake or seed tournament data', () => {
    const src = fs.readFileSync(path.join(__dirname, 'admin-tournaments.controller.ts'), 'utf8');
    expect(src).not.toMatch(/fake|seed|FAKE|SEED/i);
  });

  it('no public tournament controller exists (Slice 8)', () => {
    expect(
      fs.existsSync(path.join(__dirname, '..', '..', 'tournaments', 'tournament.controller.ts')),
    ).toBe(false);
  });
});
