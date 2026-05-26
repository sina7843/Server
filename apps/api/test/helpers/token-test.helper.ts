/* global expect */

/** Public token response DTO — refreshToken is in the HttpOnly cookie, not the body. */
export interface TestTokenResponse {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

/** Internal service result — includes refreshToken for cookie-setting by controller. */
export interface TestTokenServiceResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export function createTestTokenResponse(
  overrides: Partial<TestTokenServiceResult> = {},
): TestTokenServiceResult {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    refreshTokenExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    tokenType: 'Bearer',
    expiresIn: 900,
    ...overrides,
  };
}

export function expectTokenResponse(value: unknown): asserts value is TestTokenResponse {
  expect(value).toMatchObject({
    accessToken: expect.any(String),
    tokenType: 'Bearer',
    expiresIn: expect.any(Number),
  });

  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain('refreshToken');
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
