import { BadRequestException } from '@nestjs/common';

export type LogoutDto = Record<string, never>;

export function parseLogoutDto(value: unknown): LogoutDto {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Logout payload must be an object.');
  }

  if (Object.keys(value).length > 0) {
    throw new BadRequestException('Unknown logout fields are not allowed.');
  }

  return {};
}
