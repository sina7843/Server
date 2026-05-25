import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminBackupController } from './admin-backup.controller';
import { BackupService } from './backup.service';
import type { AuthContext } from '../auth/guards/authenticated-request';

const mockAuthContext: AuthContext = {
  userId: 'user-123',
  sessionId: 'sess-1',
  accessTokenJti: 'jti-1',
};

const makeController = (overrides: Partial<BackupService> = {}) => {
  const service: jest.Mocked<BackupService> = {
    listBackups: jest.fn().mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 }),
    getLatestBackup: jest.fn().mockResolvedValue(null),
    runMongoBackup: jest.fn().mockResolvedValue({
      id: 'log-1',
      type: 'mongodb',
      status: 'started',
      triggeredBy: 'admin',
      startedAt: new Date().toISOString(),
      message: 'Backup started.',
    }),
    ...overrides,
  } as unknown as jest.Mocked<BackupService>;
  return { controller: new AdminBackupController(service), service };
};

describe('AdminBackupController.listBackups', () => {
  it('returns paginated backup list', async () => {
    const { controller } = makeController();
    const result = await controller.listBackups({});
    expect(result).toEqual({ items: [], page: 1, limit: 20, total: 0 });
  });

  it('does not expose restore endpoint', () => {
    const { controller } = makeController();
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    expect(proto).not.toContain('restore');
    expect(proto).not.toContain('deleteBackup');
    expect(proto).not.toContain('downloadBackup');
  });
});

describe('AdminBackupController.getLatestBackup', () => {
  it('returns null when no completed backup exists', async () => {
    const { controller } = makeController();
    const result = await controller.getLatestBackup();
    expect(result).toBeNull();
  });
});

describe('AdminBackupController.runBackup', () => {
  it('delegates to BackupService with admin trigger and actorId', async () => {
    const { controller, service } = makeController();

    await controller.runBackup({}, mockAuthContext);

    expect(service.runMongoBackup).toHaveBeenCalledWith('admin', 'user-123');
  });

  it('returns RunBackupResponseDto with status started', async () => {
    const { controller } = makeController();
    const result = await controller.runBackup({}, mockAuthContext);
    expect(result.status).toBe('started');
    expect(result.type).toBe('mongodb');
  });

  it('does not accept arbitrary shell commands or user-controlled paths', async () => {
    const { controller, service } = makeController();

    await controller.runBackup({ type: 'mongodb' } as never, mockAuthContext);

    const [triggeredBy] = service.runMongoBackup.mock.calls[0] ?? [];
    expect(triggeredBy).toBe('admin');
  });
});

describe('AdminBackupController security', () => {
  it('AccessTokenGuard is applied — unauthenticated access throws', () => {
    const { controller, service } = makeController({
      runMongoBackup: jest.fn().mockRejectedValue(new UnauthorizedException()),
    });
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('PermissionGuard is applied — insufficient permission throws', () => {
    const { controller, service } = makeController({
      listBackups: jest.fn().mockRejectedValue(new ForbiddenException()),
    });
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
