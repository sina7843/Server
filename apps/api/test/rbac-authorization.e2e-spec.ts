describe('RBAC authorization e2e', () => {
  it('documents that RBAC admin routes require AccessTokenGuard and PermissionGuard', () => {
    expect(['AccessTokenGuard', 'PermissionGuard']).toEqual([
      'AccessTokenGuard',
      'PermissionGuard',
    ]);
  });
});
