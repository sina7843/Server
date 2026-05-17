import { randomInt } from 'node:crypto';
import * as argon2 from 'argon2';

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

export async function hashOtpCode(code: string): Promise<string> {
  assertOtpCode(code);

  return argon2.hash(code, {
    type: argon2.argon2id,
  });
}

export async function verifyOtpCode(code: string, codeHash: string): Promise<boolean> {
  if (!OTP_CODE_PATTERN.test(code)) {
    return false;
  }

  try {
    return await argon2.verify(codeHash, code);
  } catch {
    return false;
  }
}

function assertOtpCode(code: string): void {
  if (!OTP_CODE_PATTERN.test(code)) {
    throw new Error('OTP code must contain only digits.');
  }
}
