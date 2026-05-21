import { BadRequestException } from '@nestjs/common';
import { USER_STATUSES, type UserStatus } from '../../../auth/users/user.types';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const MAX_Q_LENGTH = 100;

export interface AdminUsersQueryDto {
  readonly status?: UserStatus;
  readonly q?: string;
  readonly page: number;
  readonly limit: number;
}

export function parseAdminUsersQuery(raw: unknown): AdminUsersQueryDto {
  const query = raw as Record<string, unknown>;

  let status: UserStatus | undefined;

  if (query.status !== undefined) {
    if (!USER_STATUSES.includes(query.status as UserStatus)) {
      throw new BadRequestException(`status must be one of: ${USER_STATUSES.join(', ')}.`);
    }

    status = query.status as UserStatus;
  }

  let q: string | undefined;

  if (query.q !== undefined) {
    if (typeof query.q !== 'string') {
      throw new BadRequestException('q must be a string.');
    }

    const trimmed = query.q.trim();

    if (trimmed.length > 0) {
      if (trimmed.length > MAX_Q_LENGTH) {
        throw new BadRequestException(`q must not exceed ${MAX_Q_LENGTH} characters.`);
      }

      q = trimmed;
    }
  }

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    ...(status !== undefined ? { status } : {}),
    ...(q !== undefined ? { q } : {}),
    page: pageRaw,
    limit: limitRaw,
  };
}
