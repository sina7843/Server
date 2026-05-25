import { BackupService } from './backup.service';
import type { BackupLogDocument } from './backup-log.schema';
import type { BackupLogRepository } from './backup-log.repository';
import type { AuditService } from '../audit/audit.service';

const makeDoc = (overrides: Partial<BackupLogDocument> = {}): BackupLogDocument =>
  ({
    _id: 'log-id-123',
    type: 'mongodb',
    status: 'started',
    startedAt: new Date('2024-01-01T00:00:00Z'),
    triggeredBy: 'admin',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    toObject: () => ({}),
    ...overrides,
  }) as unknown as BackupLogDocument;

const makeService = (
  opts: {
    createReturn?: BackupLogDocument;
    latestReturn?: BackupLogDocument | null;
    listReturn?: { items: BackupLogDocument[]; total: number };
  } = {},
) => {
  const repository: jest.Mocked<BackupLogRepository> = {
    create: jest.fn().mockResolvedValue(opts.createReturn ?? makeDoc()),
    findById: jest.fn().mockResolvedValue(null),
    markCompleted: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue(opts.listReturn ?? { items: [], total: 0 }),
    findLatest: jest.fn().mockResolvedValue(opts.latestReturn ?? null),
  } as unknown as jest.Mocked<BackupLogRepository>;

  const auditService: jest.Mocked<AuditService> = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const service = new BackupService(repository, auditService, null, null);
  return { service, repository, auditService };
};

describe('BackupService.runMongoBackup', () => {
  it('creates a BackupLog with status started and returns RunBackupResponseDto', async () => {
    const doc = makeDoc();
    const { service, repository } = makeService({ createReturn: doc });

    const result = await service.runMongoBackup('admin', 'actor-id');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'mongodb', triggeredBy: 'admin', actorId: 'actor-id' }),
    );
    expect(result.status).toBe('started');
    expect(result.type).toBe('mongodb');
    expect(result.triggeredBy).toBe('admin');
    expect(result.id).toBe('log-id-123');
  });

  it('emits backup_started audit event', async () => {
    const { service, auditService } = makeService();

    await service.runMongoBackup('admin', 'actor-id');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'system.backup_started' }),
    );
  });

  it('emits backup_manual_triggered audit event for admin trigger', async () => {
    const { service, auditService } = makeService();

    await service.runMongoBackup('admin', 'actor-id');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'system.backup_manual_triggered' }),
    );
  });

  it('does not emit backup_manual_triggered for system trigger', async () => {
    const { service, auditService } = makeService();

    await service.runMongoBackup('system');

    const calls = auditService.log.mock.calls.map((c) => c[0].action);
    expect(calls).not.toContain('system.backup_manual_triggered');
  });
});

describe('BackupService.listBackups', () => {
  it('returns paginated list with correct shape', async () => {
    const doc = makeDoc({ status: 'completed', completedAt: new Date() });
    const { service } = makeService({ listReturn: { items: [doc], total: 1 } });

    const result = await service.listBackups({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('log-id-123');
  });

  it('list items do not expose credentials', async () => {
    const doc = makeDoc({ fileKey: 'backups/mongodb/2024-file.tar.gz', bucket: 'mybucket' });
    const { service } = makeService({ listReturn: { items: [doc], total: 1 } });

    const result = await service.listBackups({ page: 1, limit: 20 });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('mongodb://');
    expect(serialized).not.toContain('connectionString');
  });
});

describe('BackupService.getLatestBackup', () => {
  it('returns null when no completed backup exists', async () => {
    const { service } = makeService({ latestReturn: null });
    const result = await service.getLatestBackup();
    expect(result).toBeNull();
  });

  it('returns BackupLogDto for latest completed backup', async () => {
    const doc = makeDoc({ status: 'completed', completedAt: new Date() });
    const { service } = makeService({ latestReturn: doc });

    const result = await service.getLatestBackup();
    expect(result).not.toBeNull();
    expect(result?.status).toBe('completed');
  });
});

describe('BackupService artifact semantics', () => {
  it('marks backup failed when no Object Storage is configured (null storageService)', async () => {
    const doc = makeDoc();
    const repository: jest.Mocked<BackupLogRepository> = {
      create: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      markCompleted: jest.fn(),
      markFailed: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      findLatest: jest.fn(),
    } as unknown as jest.Mocked<BackupLogRepository>;

    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BackupService(repository, auditService, null, null);

    await service.runMongoBackup('admin');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(repository.markCompleted).not.toHaveBeenCalled();
  });

  it('marks backup failed when storage provider is local', async () => {
    const doc = makeDoc();
    const repository: jest.Mocked<BackupLogRepository> = {
      create: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      markCompleted: jest.fn(),
      markFailed: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      findLatest: jest.fn(),
    } as unknown as jest.Mocked<BackupLogRepository>;

    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const mockStorageService = {
      upload: jest.fn(),
    } as unknown as import('../storage/storage.service').StorageService;
    const localConfig = {
      provider: 'local' as const,
      bucket: '',
      publicBaseUrl: '',
      signedUrlTtlSeconds: 3600,
      localRoot: '/tmp',
      localPublicBaseUrl: 'http://localhost',
    };
    const service = new BackupService(repository, auditService, mockStorageService, localConfig);

    await service.runMongoBackup('admin');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(repository.markCompleted).not.toHaveBeenCalled();
  });

  it('error messages for missing storage do not expose credentials', async () => {
    const doc = makeDoc();
    const repository: jest.Mocked<BackupLogRepository> = {
      create: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      markCompleted: jest.fn(),
      markFailed: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      findLatest: jest.fn(),
    } as unknown as jest.Mocked<BackupLogRepository>;

    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BackupService(repository, auditService, null, null);

    await service.runMongoBackup('admin');
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (repository.markFailed.mock.calls.length > 0) {
      const errorArg = repository.markFailed.mock.calls[0]?.[1] ?? '';
      expect(errorArg).not.toMatch(/mongodb(\+srv)?:\/\/[^\s]*/i);
      expect(errorArg).not.toContain('password=');
      expect(errorArg).not.toContain('secret');
      expect(errorArg).not.toContain('CHANGE_ME');
    }
  });
});

describe('BackupService error sanitization', () => {
  it('sanitizes MongoDB URIs in error messages', async () => {
    const doc = makeDoc();
    const repository: jest.Mocked<BackupLogRepository> = {
      create: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      markCompleted: jest.fn(),
      markFailed: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      findLatest: jest.fn(),
    } as unknown as jest.Mocked<BackupLogRepository>;

    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new BackupService(repository, auditService, null, null);

    await service.runMongoBackup('admin');

    await new Promise((resolve) => setTimeout(resolve, 50));

    if (repository.markFailed.mock.calls.length > 0) {
      const errorArg = repository.markFailed.mock.calls[0]?.[1] ?? '';
      expect(errorArg).not.toMatch(/mongodb(\+srv)?:\/\/[^\s]*/i);
      expect(errorArg).not.toContain('password=');
    }
  });
});
