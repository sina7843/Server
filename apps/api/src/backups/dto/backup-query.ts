import { BadRequestException } from '@nestjs/common';
import { BACKUP_STATUSES, BACKUP_TYPES } from '@dragon/types';
import type { BackupStatus, BackupType } from '@dragon/types';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

export interface BackupQueryDto {
  readonly type?: BackupType;
  readonly status?: BackupStatus;
  readonly page: number;
  readonly limit: number;
}

export function parseBackupQuery(raw: unknown): BackupQueryDto {
  const q = raw as Record<string, unknown>;

  let type: BackupType | undefined;
  if (q['type'] !== undefined) {
    if (!BACKUP_TYPES.includes(q['type'] as BackupType)) {
      throw new BadRequestException(`type must be one of: ${BACKUP_TYPES.join(', ')}.`);
    }
    type = q['type'] as BackupType;
  }

  let status: BackupStatus | undefined;
  if (q['status'] !== undefined) {
    if (!BACKUP_STATUSES.includes(q['status'] as BackupStatus)) {
      throw new BadRequestException(`status must be one of: ${BACKUP_STATUSES.join(', ')}.`);
    }
    status = q['status'] as BackupStatus;
  }

  const pageRaw = q['page'] !== undefined ? Number(q['page']) : DEFAULT_PAGE;
  const limitRaw = q['limit'] !== undefined ? Number(q['limit']) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    ...(type !== undefined ? { type } : {}),
    ...(status !== undefined ? { status } : {}),
    page: pageRaw,
    limit: limitRaw,
  };
}
