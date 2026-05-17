/* global expect */

const INTERNAL_SENSITIVE_KEYS = [
  "passwordHash",
  "refreshTokenHash",
  "codeHash",
  "statusReason",
  "roles",
  "permissions",
  "profile",
  "metadata",
  "accessTokenJti",
];

const RAW_SECRET_MARKERS = [
  "raw-otp-code",
  "raw-password-value",
  "raw-access-token",
  "raw-refresh-token",
  "raw-reset-token",
  "token-hash-value",
];

export function expectNoSensitiveAuthFields(value: unknown): void {
  const serialized = JSON.stringify(value);

  for (const key of INTERNAL_SENSITIVE_KEYS) {
    expect(serialized).not.toContain(key);
  }

  for (const marker of RAW_SECRET_MARKERS) {
    expect(serialized).not.toContain(marker);
  }
}

export function expectNoTokenResponse(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain("accessToken");
  expect(serialized).not.toContain("refreshToken");
  expectNoSensitiveAuthFields(value);
}

export function expectGenericSuccessResponse(value: unknown): void {
  expect(value).toMatchObject({ success: true });
  expectNoTokenResponse(value);
}
