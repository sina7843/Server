import { BadRequestException } from '@nestjs/common';
import type { ForgotPasswordRequest } from '@dragon/types';

const FORGOT_PASSWORD_DTO_ALLOWED_KEYS = new Set(['phone']);

export type ForgotPasswordDto = ForgotPasswordRequest;

export function parseForgotPasswordDto(payload: unknown): ForgotPasswordDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Forgot password payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!FORGOT_PASSWORD_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Forgot password payload contains unsupported fields.');
    }
  }

  const { phone } = payload;

  if (typeof phone !== 'string' || phone.trim().length === 0) {
    throw new BadRequestException('Phone is required.');
  }

  return { phone };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
