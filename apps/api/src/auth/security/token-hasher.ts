import { createHash, timingSafeEqual } from 'node:crypto';

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;

export function hashToken(token: string): string {
  if (token.length === 0) {
    throw new Error('Token is required.');
  }

  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function safeCompareHash(inputToken: string, expectedHash: string): boolean {
  if (inputToken.length === 0 || !SHA256_HEX_PATTERN.test(expectedHash)) {
    return false;
  }

  const actualHash = hashToken(inputToken);
  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
