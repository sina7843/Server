/* global describe, expect, it, jest */

import { createAdminAuthClient } from './admin-auth';
import { createApiClient } from './client';

function makeFetchMock(body: unknown, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe('AdminAuthClient.logout', () => {
  it('calls POST /api/v1/auth/logout', async () => {
    const fetchMock = makeFetchMock({ success: true, message: 'Logged out' });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: fetchMock,
      credentials: 'include',
    });
    const adminAuth = createAdminAuthClient(client);

    await adminAuth.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('forwards credentials: include so the browser sends the HttpOnly refresh cookie', async () => {
    const fetchMock = makeFetchMock({ success: true, message: 'Logged out' });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: fetchMock,
      credentials: 'include',
    });
    const adminAuth = createAdminAuthClient(client);

    await adminAuth.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('forwards Authorization header when client is configured with a bearer token', async () => {
    const fetchMock = makeFetchMock({ success: true, message: 'Logged out' });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: fetchMock,
      credentials: 'include',
      headers: { Authorization: 'Bearer test-access-token' },
    });
    const adminAuth = createAdminAuthClient(client);

    await adminAuth.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-access-token' }),
      }),
    );
  });

  it('logout response does not contain refreshToken', async () => {
    const fetchMock = makeFetchMock({ success: true, message: 'Logged out' });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: fetchMock,
      credentials: 'include',
    });
    const adminAuth = createAdminAuthClient(client);

    const result = await adminAuth.logout();

    expect(JSON.stringify(result)).not.toContain('refreshToken');
  });
});
