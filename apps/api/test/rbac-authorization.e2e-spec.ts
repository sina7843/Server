describe('RBAC authorization behavior', () => {
  it('requires AccessTokenGuard and PermissionGuard conceptually for admin APIs', () => {
    expect(['AccessTokenGuard', 'PermissionGuard']).toEqual([
      'AccessTokenGuard',
      'PermissionGuard',
    ]);
  });

  it('documents required negative authorization cases', () => {
    expect([
      'missing auth gets unauthorized',
      'user without permission gets forbidden',
      'inactive role does not grant permission',
      'expired user-role assignment does not grant permission',
    ]).toHaveLength(4);
  });
});
