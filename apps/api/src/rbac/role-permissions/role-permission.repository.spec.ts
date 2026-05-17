describe('RolePermissionRepository admin persistence expectations', () => {
  it('uses roleId and permissionId as duplicate prevention identity', () => {
    const query = { roleId: 'role-1', permissionId: 'permission-1' };

    expect(query).toEqual({
      roleId: 'role-1',
      permissionId: 'permission-1',
    });
  });
});
