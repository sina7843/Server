import { BadRequestException } from '@nestjs/common';

const REFRESH_DTO_ALLOWED_KEYS = new Set(['refreshToken']);

export interface RefreshDto {
  readonly refreshToken: string;
}

export function parseRefreshDto(payload: unknown): RefreshDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Refresh payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!REFRESH_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Refresh payload contains unsupported fields.');
    }
  }

  const { refreshToken } = payload;

  if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    throw new BadRequestException('Refresh token is required.');
  }

  return { refreshToken };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
