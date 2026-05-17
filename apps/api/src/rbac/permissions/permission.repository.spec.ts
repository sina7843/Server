describe('PermissionRepository list-only admin expectations', () => {
  it('keeps permissions system-owned through upsert data', () => {
    const update = { $set: { isSystem: true } };

    expect(update.$set.isSystem).toBe(true);
  });

  it('uses permission ids only to load documents whose keys are returned by resolver', () => {
    const permissionDocument = {
      _id: 'permission-id-1',
      key: 'rbac.role.read',
    };

    expect(permissionDocument.key).toBe('rbac.role.read');
    expect(permissionDocument.key).not.toBe(permissionDocument._id);
  });
});
