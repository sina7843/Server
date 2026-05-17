import { randomInt } from 'node:crypto';
import { hashToken, safeCompareHash } from './token-hasher';

const OTP_CODE_PATTERN = /^\d+$/;

export function generateOtpCode(length = 6): string {
  if (!Number.isInteger(length) || length < 4 || length > 10) {
    throw new Error('OTP code length must be an integer between 4 and 10.');
  }

  let code = '';

  for (let index = 0; index < length; index += 1) {
    code += String(randomInt(0, 10));
  }

  return code;
}

export function hashOtpCode(code: string): string {
  assertOtpCode(code);

  return hashToken(code);
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  if (!OTP_CODE_PATTERN.test(code)) {
    return false;
  }

  return safeCompareHash(code, codeHash);
}

function assertOtpCode(code: string): void {
  if (!OTP_CODE_PATTERN.test(code)) {
    throw new Error('OTP code must contain only digits.');
  }
}
