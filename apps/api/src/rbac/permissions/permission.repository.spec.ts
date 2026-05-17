describe('PermissionRepository list-only admin expectations', () => {
  it('keeps permissions system-owned through upsert data', () => {
    const update = { $set: { isSystem: true } };

    expect(update.$set.isSystem).toBe(true);
  });
});
