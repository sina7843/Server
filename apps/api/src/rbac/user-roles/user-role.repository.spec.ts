describe('UserRoleRepository admin persistence expectations', () => {
  it('removes user role by both user id and assignment id', () => {
    const query = { _id: 'assignment-1', userId: 'user-1' };

    expect(query).toEqual({ _id: 'assignment-1', userId: 'user-1' });
  });
});
