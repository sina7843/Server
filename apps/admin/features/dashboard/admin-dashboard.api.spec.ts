import { ApiClientError, createAdminDashboardClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

function makeClient() {
  return createAdminDashboardClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminDashboardClient', () => {
  it('getSummary sends GET /admin/v1/dashboard/summary', async () => {
    mockJson({ users: { total: 5, active: 4, pending: 1 }, system: { status: 'ok' } });

    const result = await makeClient().getSummary();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/dashboard/summary'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.users?.total).toBe(5);
    expect(result.users?.active).toBe(4);
    expect(result.users?.pending).toBe(1);
    expect(result.system?.status).toBe('ok');
  });

  it('getSummary response does not include sensitive fields', async () => {
    mockJson({ users: { total: 5 } });

    const result = await makeClient().getSummary();

    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(result)).not.toContain('phone');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().getSummary()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminDashboardClient: no fake data exposure', () => {
  it('SDK client has no createMetric method', () => {
    const client = makeClient();

    expect('createMetric' in client).toBe(false);
  });

  it('SDK client has no updateMetric method', () => {
    const client = makeClient();

    expect('updateMetric' in client).toBe(false);
  });
});
