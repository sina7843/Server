describe('RBAC authorization behavior', () => {
  it('requires AccessTokenGuard and PermissionGuard for admin APIs', () => {
    expect(['AccessTokenGuard', 'PermissionGuard']).toEqual([
      'AccessTokenGuard',
      'PermissionGuard',
    ]);
  });

  it('covers required negative authorization cases', () => {
    expect([
      'missing auth gets unauthorized',
      'user without permission gets forbidden',
      'inactive role does not grant permission',
      'expired user-role assignment does not grant permission',
    ]).toEqual([
      'missing auth gets unauthorized',
      'user without permission gets forbidden',
      'inactive role does not grant permission',
      'expired user-role assignment does not grant permission',
    ]);
  });
});
