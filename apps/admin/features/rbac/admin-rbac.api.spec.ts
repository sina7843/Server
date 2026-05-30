import { ApiClientError, createAdminRbacClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const ROLE_ID = '64f000000000000000000001';
const PERM_ID = '64f000000000000000000002';

const mockRole = {
  id: ROLE_ID,
  key: 'editor',
  name: 'Editor',
  description: 'Can edit content',
  isSystem: false,
  isAssignable: true,
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockPermission = {
  id: PERM_ID,
  key: 'content.post.create',
  module: 'content',
  resource: 'post',
  action: 'create',
  isSystem: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('createAdminRbacClient', () => {
  function makeClient() {
    return createAdminRbacClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listRoles sends GET /admin/v1/roles', async () => {
    mockJson({ roles: [mockRole] });

    const result = await makeClient().listRoles();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/roles'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.roles).toHaveLength(1);
    expect(result.roles[0]!.id).toBe(ROLE_ID);
  });

  it('listRoles response does not expose isSystem as editable or sensitive data', async () => {
    mockJson({ roles: [mockRole] });

    const result = await makeClient().listRoles();

    expect(result.roles[0]!.isSystem).toBe(false);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('getRole sends GET /admin/v1/roles/:id', async () => {
    mockJson(mockRole);

    const result = await makeClient().getRole(ROLE_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.id).toBe(ROLE_ID);
  });

  it('createRole sends POST /admin/v1/roles with safe fields only', async () => {
    mockJson(mockRole);

    await makeClient().createRole({ key: 'editor', name: 'Editor' });

    const [[, init]] = mockFetch.mock.calls;
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.key).toBe('editor');
    expect(body.name).toBe('Editor');
    expect('isSystem' in body).toBe(false);
    expect('permissionIds' in body).toBe(false);
    expect('userIds' in body).toBe(false);
  });

  it('updateRole sends PATCH /admin/v1/roles/:id', async () => {
    mockJson({ ...mockRole, name: 'Senior Editor' });

    const result = await makeClient().updateRole(ROLE_ID, { name: 'Senior Editor' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}`),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.name).toBe('Senior Editor');
  });

  it('updateRole body does not include key or isSystem', async () => {
    mockJson(mockRole);

    await makeClient().updateRole(ROLE_ID, { name: 'Updated' });

    const [[, init]] = mockFetch.mock.calls;
    const body = JSON.parse(init.body as string);
    expect('key' in body).toBe(false);
    expect('isSystem' in body).toBe(false);
  });

  it('deactivateRole sends DELETE /admin/v1/roles/:id', async () => {
    mockJson({ success: true, message: 'Role deactivated.' });

    const result = await makeClient().deactivateRole(ROLE_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });

  it('listRolePermissions sends GET /admin/v1/roles/:id/permissions', async () => {
    mockJson({ permissions: [mockPermission] });

    const result = await makeClient().listRolePermissions(ROLE_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}/permissions`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0]!.id).toBe(PERM_ID);
  });

  it('listPermissions sends GET /admin/v1/permissions', async () => {
    mockJson({ permissions: [mockPermission] });

    await makeClient().listPermissions();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/permissions'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('listPermissions passes module query param', async () => {
    mockJson({ permissions: [] });

    await makeClient().listPermissions({ module: 'content' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('module=content'),
      expect.anything(),
    );
  });

  it('attachPermissionToRole sends POST /admin/v1/roles/:id/permissions', async () => {
    mockJson({ success: true, message: 'Permission attached to role.' });

    const result = await makeClient().attachPermissionToRole(ROLE_ID, { permissionId: PERM_ID });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}/permissions`),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.success).toBe(true);
  });

  it('detachPermissionFromRole sends DELETE /admin/v1/roles/:id/permissions/:permissionId', async () => {
    mockJson({ success: true, message: 'Permission detached from role.' });

    const result = await makeClient().detachPermissionFromRole(ROLE_ID, PERM_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/roles/${ROLE_ID}/permissions/${PERM_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().listRoles()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('admin RBAC SDK: no permission mutation methods', () => {
  it('SDK client has no createPermission method', () => {
    const client = createAdminRbacClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );

    expect('createPermission' in client).toBe(false);
  });

  it('SDK client has no updatePermission method', () => {
    const client = createAdminRbacClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );

    expect('updatePermission' in client).toBe(false);
  });

  it('SDK client has no deletePermission method', () => {
    const client = createAdminRbacClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );

    expect('deletePermission' in client).toBe(false);
  });
});

describe('admin RBAC SDK: system role restrictions visible in responses', () => {
  it('system role flag is returned in role response', async () => {
    const systemRole = {
      ...{
        id: '64f000000000000000000099',
        key: 'super_admin',
        name: 'Super Admin',
        isSystem: true,
        isAssignable: false,
        isActive: true,
      },
    };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => systemRole });

    const client = createAdminRbacClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
    const result = await client.getRole('64f000000000000000000099');

    expect(result.isSystem).toBe(true);
  });
});
