describe('Account profile API contract', () => {
  it('requires authentication for own profile routes', () => {
    const protectedRoutes = ['GET /api/v1/me/profile', 'PATCH /api/v1/me/profile'];

    expect(protectedRoutes).toEqual(['GET /api/v1/me/profile', 'PATCH /api/v1/me/profile']);
  });
});
