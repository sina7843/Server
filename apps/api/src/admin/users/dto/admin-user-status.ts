import { BadRequestException } from '@nestjs/common';
import { USER_STATUSES, type UserStatus } from '../../../auth/users/user.types';

const MAX_REASON_LENGTH = 500;

export interface AdminUserStatusUpdateDto {
  readonly status: UserStatus;
  readonly reason?: string;
}

export function parseAdminUserStatusUpdate(raw: unknown): AdminUserStatusUpdateDto {
  if (raw === null || typeof raw !== 'object') {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  if (!USER_STATUSES.includes(body.status as UserStatus)) {
    throw new BadRequestException(`status must be one of: ${USER_STATUSES.join(', ')}.`);
  }

  const status = body.status as UserStatus;
  let reason: string | undefined;

  if (body.reason !== undefined) {
    if (typeof body.reason !== 'string') {
      throw new BadRequestException('reason must be a string.');
    }

    const trimmed = body.reason.trim();

    if (trimmed.length > MAX_REASON_LENGTH) {
      throw new BadRequestException(`reason must not exceed ${MAX_REASON_LENGTH} characters.`);
    }

    if (trimmed.length > 0) {
      reason = trimmed;
    }
  }

  return {
    status,
    ...(reason !== undefined ? { reason } : {}),
  };
}
