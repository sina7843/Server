import { ApiClientError, createAdminSystemClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

function makeClient() {
  return createAdminSystemClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminSystemClient', () => {
  it('getHealth sends GET /admin/v1/system/health', async () => {
    const now = new Date().toISOString();
    mockJson({ status: 'ok', service: 'api', checkedAt: now });

    const result = await makeClient().getHealth();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/system/health'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.checkedAt).toBe(now);
  });

  it('getHealth response does not contain sensitive fields', async () => {
    mockJson({ status: 'ok', service: 'api', checkedAt: new Date().toISOString() });

    const result = await makeClient().getHealth();

    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('password');
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().getHealth()).rejects.toBeInstanceOf(ApiClientError);
  });
});
