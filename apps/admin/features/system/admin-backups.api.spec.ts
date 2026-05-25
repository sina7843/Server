import { ApiClientError, createAdminBackupsClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

function makeClient() {
  return createAdminBackupsClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

const makeBackupLog = (overrides = {}) => ({
  id: 'backup-id-123',
  type: 'mongodb',
  status: 'completed',
  startedAt: '2024-01-01T00:00:00.000Z',
  completedAt: '2024-01-01T00:05:00.000Z',
  triggeredBy: 'admin',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:05:00.000Z',
  ...overrides,
});

describe('createAdminBackupsClient.listBackups', () => {
  it('sends GET /admin/v1/system/backups', async () => {
    mockJson({ items: [], page: 1, limit: 20, total: 0 });

    const result = await makeClient().listBackups();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/system/backups'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('includes query params when provided', async () => {
    mockJson({ items: [], page: 1, limit: 10, total: 0 });

    await makeClient().listBackups({ status: 'completed', page: 1, limit: 10 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/status=completed/),
      expect.anything(),
    );
  });

  it('response does not contain sensitive fields', async () => {
    mockJson({
      items: [makeBackupLog()],
      page: 1,
      limit: 20,
      total: 1,
    });

    const result = await makeClient().listBackups();
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('connectionString');
    expect(serialized).not.toContain('MONGODB_URI');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().listBackups()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminBackupsClient.getLatestBackup', () => {
  it('sends GET /admin/v1/system/backups/latest', async () => {
    mockJson(makeBackupLog());

    const result = await makeClient().getLatestBackup();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/system/backups/latest'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result?.id).toBe('backup-id-123');
    expect(result?.status).toBe('completed');
  });

  it('returns null when no completed backup exists', async () => {
    mockJson(null);

    const result = await makeClient().getLatestBackup();

    expect(result).toBeNull();
  });

  it('response does not contain credentials', async () => {
    mockJson(makeBackupLog());

    const result = await makeClient().getLatestBackup();
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('MONGODB_URI');
    expect(serialized).not.toContain('connectionString');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().getLatestBackup()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminBackupsClient.runBackup', () => {
  it('sends POST /admin/v1/system/backups/run', async () => {
    mockJson({
      id: 'backup-id-456',
      type: 'mongodb',
      status: 'started',
      triggeredBy: 'admin',
      startedAt: '2024-01-01T00:00:00.000Z',
      message: 'Backup started.',
    });

    const result = await makeClient().runBackup({});

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/system/backups/run'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.status).toBe('started');
    expect(result.type).toBe('mongodb');
  });

  it('response does not contain credentials or file paths', async () => {
    mockJson({
      id: 'backup-id-456',
      type: 'mongodb',
      status: 'started',
      triggeredBy: 'admin',
      startedAt: '2024-01-01T00:00:00.000Z',
      message: 'Backup started.',
    });

    const result = await makeClient().runBackup({});
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('/tmp/');
    expect(serialized).not.toContain('MONGODB_URI');
  });

  it('SDK has no restore method', () => {
    const client = makeClient();
    const clientAsAny = client as unknown as Record<string, unknown>;
    expect(typeof clientAsAny['restore']).toBe('undefined');
    expect(typeof clientAsAny['deleteBackup']).toBe('undefined');
    expect(typeof clientAsAny['downloadBackup']).toBe('undefined');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().runBackup({})).rejects.toBeInstanceOf(ApiClientError);
  });
});
