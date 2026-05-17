/* global expect */

export interface TestTokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export function createTestTokenResponse(
  overrides: Partial<TestTokenResponse> = {},
): TestTokenResponse {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    ...overrides,
  };
}

export function expectTokenResponse(value: unknown): asserts value is TestTokenResponse {
  expect(value).toMatchObject({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
    tokenType: 'Bearer',
    expiresIn: expect.any(Number),
  });

  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('refreshTokenHash');
  expect(serialized).not.toContain('profile');
  expect(serialized).not.toContain('roles');
  expect(serialized).not.toContain('permissions');
}

export function expectMinimalAccessTokenClaims(claims: Record<string, unknown>): void {
  expect(claims).toHaveProperty('sub');
  expect(claims).toHaveProperty('jti');
  expect(claims).not.toHaveProperty('phone');
  expect(claims).not.toHaveProperty('passwordHash');
  expect(claims).not.toHaveProperty('roles');
  expect(claims).not.toHaveProperty('permissions');
  expect(claims).not.toHaveProperty('profile');
  expect(claims).not.toHaveProperty('statusReason');
}
