import { BadRequestException } from '@nestjs/common';
import type { VerifyPhoneRequest } from '@dragon/types';

const VERIFY_PHONE_DTO_ALLOWED_KEYS = new Set(['phone', 'code']);

export type VerifyPhoneDto = VerifyPhoneRequest;

export function parseVerifyPhoneDto(payload: unknown): VerifyPhoneDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Phone verification payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!VERIFY_PHONE_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Phone verification payload contains unsupported fields.');
    }
  }

  const { phone, code } = payload;

  if (typeof phone !== 'string' || phone.trim().length === 0) {
    throw new BadRequestException('Phone is required.');
  }

  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new BadRequestException('Verification code is required.');
  }

  return {
    phone,
    code,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
