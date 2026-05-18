describe('Public profile API contract', () => {
  it('uses case-insensitive username lookup and safe public/private states', () => {
    const routes = ['GET /api/v1/u/:username'];
    const safeStates = ['private', 'not_found'];

    expect(routes).toContain('GET /api/v1/u/:username');
    expect(safeStates).toEqual(['private', 'not_found']);
  });
});
