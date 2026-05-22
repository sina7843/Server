import { BadRequestException } from '@nestjs/common';

const ADMIN_STATUS_UPDATE_TARGETS = ['active', 'suspended', 'banned', 'deleted'] as const;
type AdminStatusUpdateTarget = (typeof ADMIN_STATUS_UPDATE_TARGETS)[number];

const MAX_REASON_LENGTH = 500;

export interface AdminUserStatusUpdateDto {
  readonly status: AdminStatusUpdateTarget;
  readonly reason?: string;
}

export function parseAdminUserStatusUpdate(raw: unknown): AdminUserStatusUpdateDto {
  if (raw === null || typeof raw !== 'object') {
    throw new BadRequestException('Request body must be an object.');
  }

  const body = raw as Record<string, unknown>;

  if (!(ADMIN_STATUS_UPDATE_TARGETS as readonly unknown[]).includes(body.status)) {
    throw new BadRequestException(
      `status must be one of: ${ADMIN_STATUS_UPDATE_TARGETS.join(', ')}.`,
    );
  }

  const status = body.status as AdminStatusUpdateTarget;
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
