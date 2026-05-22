import { ApiClientError } from '@dragon/sdk';
import { adminLogin, fetchAdminIdentity } from './admin-auth.api';

const mockFetch = jest.fn();

global.fetch = mockFetch;

function mockLoginSuccess() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer' as const,
      expiresIn: 900,
    }),
  });
}

function mockGetMeSuccess(overrides: { permissions?: string[]; isSuperAdmin?: boolean } = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      user: { id: 'admin-1', phoneVerified: true, status: 'active', phoneMasked: '***00' },
      permissions: overrides.permissions ?? ['admin.dashboard.view'],
      isSuperAdmin: overrides.isSuperAdmin ?? false,
    }),
  });
}

function mockGetMeForbidden() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
}

function mockLoginUnauthorized() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('adminLogin', () => {
  it('returns token and identity on successful admin login', async () => {
    mockLoginSuccess();
    mockGetMeSuccess();

    const result = await adminLogin('+1234567890', 'secure-pass', '/');

    expect(result.token).toBe('test-token');
    expect(result.identity.user.id).toBe('admin-1');
    expect(result.identity.user.status).toBe('active');
  });

  it('identity includes permissions array', async () => {
    mockLoginSuccess();
    mockGetMeSuccess({ permissions: ['admin.dashboard.view', 'user.user.read'] });

    const result = await adminLogin('+1234567890', 'secure-pass', '/');

    expect(Array.isArray(result.identity.permissions)).toBe(true);
    expect(result.identity.permissions).toContain('admin.dashboard.view');
    expect(result.identity.permissions).toContain('user.user.read');
  });

  it('identity includes isSuperAdmin flag', async () => {
    mockLoginSuccess();
    mockGetMeSuccess({ isSuperAdmin: true });

    const result = await adminLogin('+1234567890', 'secure-pass', '/');

    expect(result.identity.isSuperAdmin).toBe(true);
  });

  it('throws on invalid credentials', async () => {
    mockLoginUnauthorized();

    await expect(adminLogin('+1234567890', 'wrong-pass', '/')).rejects.toThrow('Invalid credentials.');
  });

  it('throws on insufficient admin permissions', async () => {
    mockLoginSuccess();
    mockGetMeForbidden();

    await expect(adminLogin('+1234567890', 'secure-pass', '/')).rejects.toThrow(
      'Access denied: insufficient admin permissions.',
    );
  });

  it('response does not contain sensitive fields', async () => {
    mockLoginSuccess();
    mockGetMeSuccess();

    const result = await adminLogin('+1234567890', 'secure-pass', '/');
    const serialized = JSON.stringify(result.identity);

    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshTokenHash');
    expect(serialized).not.toContain('statusReason');
    expect(serialized).not.toContain('roleKeys');
  });
});

describe('fetchAdminIdentity', () => {
  it('fetches admin identity using bearer token', async () => {
    mockGetMeSuccess();

    const identity = await fetchAdminIdentity('test-token', '/');

    expect(identity.user.id).toBe('admin-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('returns permissions from identity', async () => {
    mockGetMeSuccess({ permissions: ['admin.dashboard.view', 'rbac.role.read'] });

    const identity = await fetchAdminIdentity('test-token', '/');

    expect(identity.permissions).toContain('admin.dashboard.view');
    expect(identity.permissions).toContain('rbac.role.read');
  });

  it('returns isSuperAdmin flag from identity', async () => {
    mockGetMeSuccess({ isSuperAdmin: false });

    const identity = await fetchAdminIdentity('test-token', '/');

    expect(identity.isSuperAdmin).toBe(false);
  });

  it('throws ApiClientError on 403', async () => {
    mockGetMeForbidden();

    await expect(fetchAdminIdentity('expired-token', '/')).rejects.toBeInstanceOf(ApiClientError);
  });
});
