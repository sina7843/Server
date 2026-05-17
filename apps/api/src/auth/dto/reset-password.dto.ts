import { BadRequestException } from '@nestjs/common';
import type { ResetPasswordRequest } from '@dragon/types';

const RESET_PASSWORD_DTO_ALLOWED_KEYS = new Set(['resetToken', 'newPassword']);

export type ResetPasswordDto = ResetPasswordRequest;

export function parseResetPasswordDto(payload: unknown): ResetPasswordDto {
  if (!isRecord(payload)) {
    throw new BadRequestException('Reset password payload must be an object.');
  }

  for (const key of Object.keys(payload)) {
    if (!RESET_PASSWORD_DTO_ALLOWED_KEYS.has(key)) {
      throw new BadRequestException('Reset password payload contains unsupported fields.');
    }
  }

  const { resetToken, newPassword } = payload;

  if (typeof resetToken !== 'string' || resetToken.trim().length === 0) {
    throw new BadRequestException('Reset token is required.');
  }

  if (typeof newPassword !== 'string' || newPassword.length === 0) {
    throw new BadRequestException('New password is required.');
  }

  return { resetToken, newPassword };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
