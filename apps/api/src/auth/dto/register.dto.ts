import { BadRequestException } from '@nestjs/common';
import type { RegisterRequest } from '@dragon/types';

const REGISTER_DTO_ALLOWED_KEYS = new Set(['phone', 'password']);

export type RegisterDto = RegisterRequest;

export function parseRegisterDto(payload: unknown): RegisterDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Registration payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!REGISTER_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Registration payload contains unsupported fields.');
    }
  }

  const { phone, password } = payload;

  if (typeof phone !== 'string' || phone.trim().length === 0) {
    throw new BadRequestException('Phone is required.');
  }

  if (typeof password !== 'string' || password.length === 0) {
    throw new BadRequestException('Password is required.');
  }

  return {
    phone,
    password,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
