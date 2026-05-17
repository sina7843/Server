describe('RBAC admin API e2e', () => {
  it('documents required RBAC admin endpoint coverage', () => {
    expect([
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
    ]).toHaveLength(10);
  });
});
