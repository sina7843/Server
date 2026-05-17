import { BadRequestException } from '@nestjs/common';
const LOGIN_DTO_ALLOWED_KEYS = new Set(['phone', 'password', 'deviceId', 'deviceName']);

export interface LoginDto {
  readonly phone: string;
  readonly password: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
}

export function parseLoginDto(payload: unknown): LoginDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Login payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!LOGIN_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Login payload contains unsupported fields.');
    }
  }

  const { phone, password, deviceId, deviceName } = payload;

  if (typeof phone !== 'string' || phone.trim().length === 0) {
    throw new BadRequestException('Phone is required.');
  }

  if (typeof password !== 'string' || password.length === 0) {
    throw new BadRequestException('Password is required.');
  }

  if (deviceId !== undefined && (typeof deviceId !== 'string' || deviceId.trim().length === 0)) {
    throw new BadRequestException('Device id must be a non-empty string when provided.');
  }

  if (
    deviceName !== undefined &&
    (typeof deviceName !== 'string' || deviceName.trim().length === 0)
  ) {
    throw new BadRequestException('Device name must be a non-empty string when provided.');
  }

  return {
    phone,
    password,
    ...(typeof deviceId === 'string' ? { deviceId } : {}),
    ...(typeof deviceName === 'string' ? { deviceName } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
