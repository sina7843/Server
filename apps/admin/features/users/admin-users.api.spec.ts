import { ApiClientError, createAdminUsersClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const USER_ID = '64f000000000000000000001';
const SESSION_ID = '64f000000000000000000002';

const mockUser = {
  id: USER_ID,
  status: 'active' as const,
  phoneMasked: '***01',
  phoneVerified: true,
  profile: { username: 'testuser', displayName: 'Test User', publicUrl: '/u/testuser' },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('createAdminUsersClient', () => {
  function makeClient() {
    return createAdminUsersClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listUsers sends GET /admin/v1/users', async () => {
    mockJson({ users: [mockUser], total: 1, page: 1, limit: 20 });

    const result = await makeClient().listUsers();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/users'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.users).toHaveLength(1);
    expect(result.users[0]!.id).toBe(USER_ID);
  });

  it('listUsers passes status query param', async () => {
    mockJson({ users: [], total: 0, page: 1, limit: 20 });

    await makeClient().listUsers({ status: 'suspended' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=suspended'),
      expect.anything(),
    );
  });

  it('getUser sends GET /admin/v1/users/:id', async () => {
    mockJson({ user: mockUser });

    const result = await makeClient().getUser(USER_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/users/${USER_ID}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.user.id).toBe(USER_ID);
  });

  it('getUser response does not contain sensitive fields', async () => {
    mockJson({ user: mockUser });

    const result = await makeClient().getUser(USER_ID);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshTokenHash');
  });

  it('updateUserStatus sends PATCH /admin/v1/users/:id/status', async () => {
    mockJson({ user: { ...mockUser, status: 'suspended' } });

    const result = await makeClient().updateUserStatus(USER_ID, {
      status: 'suspended',
      reason: 'Policy violation',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/users/${USER_ID}/status`),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.user.status).toBe('suspended');
  });

  it('listUserSessions sends GET /admin/v1/users/:id/sessions', async () => {
    mockJson({
      sessions: [
        {
          id: SESSION_ID,
          expiresAt: '2025-12-31T00:00:00.000Z',
          createdAt: '2025-01-01T00:00:00.000Z',
          isActive: true,
        },
      ],
    });

    const result = await makeClient().listUserSessions(USER_ID);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('refreshTokenHash');
    expect(result.sessions).toHaveLength(1);
  });

  it('revokeUserSession sends DELETE to user-scoped session path', async () => {
    mockJson({ success: true, message: 'Session revoked.' });

    const result = await makeClient().revokeUserSession(USER_ID, SESSION_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/users/${USER_ID}/sessions/${SESSION_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });

  it('revokeUserSession path always scopes session under the given userId', async () => {
    const OTHER_SESSION = '64f000000000000000000099';
    mockJson({ success: true, message: 'Session revoked.' });

    await makeClient().revokeUserSession(USER_ID, OTHER_SESSION);

    const [[calledUrl]] = mockFetch.mock.calls;
    expect(calledUrl).toContain(`/admin/v1/users/${USER_ID}/sessions/${OTHER_SESSION}`);
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().listUsers()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('admin users API: no impersonation or reset-password methods', () => {
  it('SDK client has no impersonate method', () => {
    const client = createAdminUsersClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );

    expect('impersonate' in client).toBe(false);
    expect('resetPassword' in client).toBe(false);
  });
});
