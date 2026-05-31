import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminGamesController } from './admin-games.controller';
import { GameService } from '../../games/game.service';
import { Permissions } from '../../rbac/registry/permission-keys';
import { PERMISSION_METADATA_KEY } from '../../rbac/decorators/permission-metadata';
import type { GameDocument } from '../../games/game.schema';
import type { PermissionMetadata } from '../../rbac/decorators/permission-metadata';
import * as path from 'path';
import * as fs from 'fs';

function makeGame(overrides: Partial<Record<string, unknown>> = {}): GameDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'Counter-Strike',
    slug: 'counter-strike',
    slugNormalized: 'counter-strike',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as GameDocument;
}

function makeRequest(userId?: string) {
  return { auth: userId ? { userId } : undefined } as never;
}

function getPermissionMetadata(handler: object): PermissionMetadata | undefined {
  return Reflect.getMetadata(PERMISSION_METADATA_KEY, handler) as PermissionMetadata | undefined;
}

describe('AdminGamesController — permission decorators', () => {
  it('listGames requires TOURNAMENT_GAME_READ', () => {
    const metadata = getPermissionMetadata(AdminGamesController.prototype.listGames);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_GAME_READ);
  });

  it('getGame requires TOURNAMENT_GAME_READ', () => {
    const metadata = getPermissionMetadata(AdminGamesController.prototype.getGame);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_GAME_READ);
  });

  it('createGame requires TOURNAMENT_GAME_MANAGE', () => {
    const metadata = getPermissionMetadata(AdminGamesController.prototype.createGame);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_GAME_MANAGE);
  });

  it('updateGame requires TOURNAMENT_GAME_MANAGE', () => {
    const metadata = getPermissionMetadata(AdminGamesController.prototype.updateGame);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_GAME_MANAGE);
  });

  it('deleteGame requires TOURNAMENT_GAME_MANAGE', () => {
    const metadata = getPermissionMetadata(AdminGamesController.prototype.deleteGame);
    expect(metadata?.permissionKeys).toContain(Permissions.TOURNAMENT_GAME_MANAGE);
  });
});

describe('AdminGamesController — listGames', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;

  beforeEach(() => {
    gameService = { list: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    controller = new AdminGamesController(gameService as unknown as GameService);
  });

  it('returns paginated list with correct shape', async () => {
    const game = makeGame();
    (gameService.list as jest.Mock).mockResolvedValue({ items: [game], total: 1 });

    const result = await controller.listGames('1', '20');

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('uses default page and limit when query params are absent', async () => {
    await controller.listGames();

    expect(gameService.list).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: false }),
      1,
      20,
    );
  });

  it('filters by status when a valid status is provided', async () => {
    await controller.listGames('1', '20', 'inactive');

    expect(gameService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'inactive', includeDeleted: false }),
      1,
      20,
    );
  });

  it('ignores invalid status values and omits status from filter', async () => {
    await controller.listGames('1', '20', 'unknown');

    const callFilter = (gameService.list as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callFilter).not.toHaveProperty('status');
    expect(callFilter).toHaveProperty('includeDeleted', false);
  });

  it('excludes deleted games (includeDeleted=false)', async () => {
    await controller.listGames();

    expect(gameService.list).toHaveBeenCalledWith(
      expect.objectContaining({ includeDeleted: false }),
      expect.any(Number),
      expect.any(Number),
    );
  });
});

describe('AdminGamesController — getGame', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;

  beforeEach(() => {
    gameService = { findById: jest.fn().mockResolvedValue(null) };
    controller = new AdminGamesController(gameService as unknown as GameService);
  });

  it('returns a GameDto for an existing game', async () => {
    const game = makeGame();
    (gameService.findById as jest.Mock).mockResolvedValue(game);

    const result = await controller.getGame('507f1f77bcf86cd799439011');

    expect(result.id).toBe('507f1f77bcf86cd799439011');
    expect(result.name).toBe('Counter-Strike');
    expect(result.slug).toBe('counter-strike');
    expect(result.status).toBe('active');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('throws NotFoundException for a non-existent game', async () => {
    (gameService.findById as jest.Mock).mockResolvedValue(null);

    await expect(controller.getGame('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for an invalid ObjectId', async () => {
    await expect(controller.getGame('not-an-object-id')).rejects.toThrow(BadRequestException);
  });

  it('returned GameDto does not include internal deletedAt field', async () => {
    const game = makeGame({ deletedAt: new Date() });
    (gameService.findById as jest.Mock).mockResolvedValue(game);

    const result = await controller.getGame('507f1f77bcf86cd799439011');

    expect(result).not.toHaveProperty('deletedAt');
  });
});

describe('AdminGamesController — createGame', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    gameService = { create: jest.fn().mockResolvedValue(makeGame()) };
    auditMock = { log: jest.fn() };
    controller = new AdminGamesController(
      gameService as unknown as GameService,
      auditMock as never,
    );
  });

  it('creates a game and returns GameDto', async () => {
    const result = await controller.createGame(
      { name: 'Counter-Strike', slug: 'counter-strike', status: 'active' },
      makeRequest('admin1'),
    );

    expect(result.id).toBeDefined();
    expect(result.slug).toBe('counter-strike');
    expect(result.status).toBe('active');
  });

  it('fires audit log after successful create', async () => {
    await controller.createGame(
      { name: 'Counter-Strike', slug: 'counter-strike', status: 'active' },
      makeRequest('admin1'),
    );

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        severity: 'info',
      }),
    );
  });

  it('throws BadRequestException when name is missing', async () => {
    await expect(
      controller.createGame({ slug: 'counter-strike', status: 'active' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when slug is missing', async () => {
    await expect(
      controller.createGame({ name: 'Counter-Strike', status: 'active' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for unknown fields in body', async () => {
    await expect(
      controller.createGame(
        { name: 'CS', slug: 'cs', status: 'active', unknownField: 'x' },
        makeRequest(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid status', async () => {
    await expect(
      controller.createGame({ name: 'CS', slug: 'cs', status: 'invalid' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('propagates ConflictException when slug is taken', async () => {
    (gameService.create as jest.Mock).mockRejectedValue(
      new ConflictException('Game slug "counter-strike" is already taken.'),
    );

    await expect(
      controller.createGame(
        { name: 'Counter-Strike', slug: 'counter-strike', status: 'active' },
        makeRequest(),
      ),
    ).rejects.toThrow(ConflictException);
  });
});

describe('AdminGamesController — updateGame', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    gameService = { update: jest.fn().mockResolvedValue(makeGame({ name: 'CS 2' })) };
    auditMock = { log: jest.fn() };
    controller = new AdminGamesController(
      gameService as unknown as GameService,
      auditMock as never,
    );
  });

  it('updates a game and returns updated GameDto', async () => {
    const result = await controller.updateGame(
      '507f1f77bcf86cd799439011',
      { name: 'CS 2' },
      makeRequest('admin1'),
    );

    expect(result.name).toBe('CS 2');
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(controller.updateGame('bad-id', { name: 'CS 2' }, makeRequest())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for unknown body fields', async () => {
    await expect(
      controller.updateGame('507f1f77bcf86cd799439011', { unknownField: 'x' }, makeRequest()),
    ).rejects.toThrow(BadRequestException);
  });

  it('fires audit log after successful update', async () => {
    await controller.updateGame(
      '507f1f77bcf86cd799439011',
      { name: 'CS 2' },
      makeRequest('admin1'),
    );

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        severity: 'info',
      }),
    );
  });

  it('propagates NotFoundException when game is not found', async () => {
    (gameService.update as jest.Mock).mockRejectedValue(new NotFoundException('Game not found.'));

    await expect(
      controller.updateGame('507f1f77bcf86cd799439011', { name: 'New' }, makeRequest()),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AdminGamesController — deleteGame', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;
  let auditMock: { log: jest.Mock };

  beforeEach(() => {
    gameService = { softDelete: jest.fn().mockResolvedValue(makeGame({ deletedAt: new Date() })) };
    auditMock = { log: jest.fn() };
    controller = new AdminGamesController(
      gameService as unknown as GameService,
      auditMock as never,
    );
  });

  it('soft deletes a game and returns success response', async () => {
    const result = await controller.deleteGame('507f1f77bcf86cd799439011', makeRequest('admin1'));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Game deleted.');
    expect(gameService.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    await expect(controller.deleteGame('not-valid', makeRequest())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException when game does not exist', async () => {
    (gameService.softDelete as jest.Mock).mockRejectedValue(
      new NotFoundException('Game not found.'),
    );

    await expect(controller.deleteGame('507f1f77bcf86cd799439011', makeRequest())).rejects.toThrow(
      NotFoundException,
    );
  });

  it('fires audit log with warning severity after delete', async () => {
    await controller.deleteGame('507f1f77bcf86cd799439011', makeRequest('admin1'));

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'admin',
        actorId: 'admin1',
        severity: 'warning',
      }),
    );
  });
});

// ─── Public API shape contract ────────────────────────────────────────────────

describe('AdminGamesController — public GameDto shape', () => {
  let controller: AdminGamesController;
  let gameService: jest.Mocked<Partial<GameService>>;

  beforeEach(() => {
    gameService = { findById: jest.fn() };
    controller = new AdminGamesController(gameService as unknown as GameService);
  });

  it('GameDto includes status field (admin-only field)', async () => {
    (gameService.findById as jest.Mock).mockResolvedValue(makeGame({ status: 'inactive' }));

    const result = await controller.getGame('507f1f77bcf86cd799439011');

    expect(result).toHaveProperty('status', 'inactive');
  });

  it('GameDto does not include slugNormalized (internal field)', async () => {
    (gameService.findById as jest.Mock).mockResolvedValue(makeGame());

    const result = await controller.getGame('507f1f77bcf86cd799439011');

    expect(result).not.toHaveProperty('slugNormalized');
  });
});

// ─── Scope guardrails ─────────────────────────────────────────────────────────

describe('AdminGamesController — scope guardrails', () => {
  it('does not import TournamentModule or TournamentService', () => {
    const src = fs.readFileSync(
      path.join(__dirname, 'admin-games.controller.ts'),
      'utf8',
    ) as string;
    expect(src).not.toMatch(/TournamentModule|TournamentService|TournamentRepository/);
  });

  it('does not hardcode localhost or qesb.ir URLs', () => {
    const src = fs.readFileSync(
      path.join(__dirname, 'admin-games.controller.ts'),
      'utf8',
    ) as string;
    expect(src).not.toMatch(/['"`]https?:\/\/localhost/);
    expect(src).not.toMatch(/['"`]https?:\/\/[a-z.]*qesb\.ir/);
  });

  it('does not contain fake game data', () => {
    const src = fs.readFileSync(
      path.join(__dirname, 'admin-games.controller.ts'),
      'utf8',
    ) as string;
    expect(src).not.toMatch(/Fake Game|Test Game|placeholder/i);
  });
});
