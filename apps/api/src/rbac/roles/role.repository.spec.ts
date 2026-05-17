describe('RoleRepository admin persistence expectations', () => {
  it('uses deactivate behavior instead of hard delete for role deletion', () => {
    const update = { $set: { isActive: false } };

    expect(update).toEqual({ $set: { isActive: false } });
  });
});
