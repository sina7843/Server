import { FORBIDDEN_PERMISSION_ENDPOINTS, RBAC_ADMIN_ENDPOINTS } from './helpers/rbac-test.factory';

describe('RBAC admin API surface', () => {
  it('defines the expected protected admin endpoints', () => {
    expect(RBAC_ADMIN_ENDPOINTS).toEqual([
      'GET /admin/v1/roles',
      'POST /admin/v1/roles',
      'GET /admin/v1/roles/:id',
      'PATCH /admin/v1/roles/:id',
      'DELETE /admin/v1/roles/:id',
      'GET /admin/v1/permissions',
      'POST /admin/v1/roles/:id/permissions',
      'DELETE /admin/v1/roles/:id/permissions/:permissionId',
      'POST /admin/v1/users/:id/roles',
      'DELETE /admin/v1/users/:id/roles/:userRoleId',
    ]);
  });

  it('does not define permission creation/update/delete APIs', () => {
    expect(FORBIDDEN_PERMISSION_ENDPOINTS).toEqual([
      'POST /admin/v1/permissions',
      'PATCH /admin/v1/permissions/:id',
      'DELETE /admin/v1/permissions/:id',
    ]);
  });
});
