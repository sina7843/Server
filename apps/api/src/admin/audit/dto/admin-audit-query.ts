import { BadRequestException } from '@nestjs/common';
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_SEVERITIES,
  type AuditActorType,
  type AuditSeverity,
} from '@dragon/types';
import type { AuditLogFilters } from '../../../audit/audit-log.types';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export interface AdminAuditQueryDto {
  readonly filters: AuditLogFilters;
  readonly page: number;
  readonly limit: number;
}

export function parseAdminAuditQuery(raw: unknown): AdminAuditQueryDto {
  const q = raw as Record<string, unknown>;

  let actorId: string | undefined;
  if (q.actorId !== undefined) {
    if (typeof q.actorId !== 'string' || !OBJECT_ID_PATTERN.test(q.actorId)) {
      throw new BadRequestException('actorId must be a valid ObjectId.');
    }
    actorId = q.actorId;
  }

  let actorType: AuditActorType | undefined;
  if (q.actorType !== undefined) {
    if (!AUDIT_ACTOR_TYPES.includes(q.actorType as AuditActorType)) {
      throw new BadRequestException(`actorType must be one of: ${AUDIT_ACTOR_TYPES.join(', ')}.`);
    }
    actorType = q.actorType as AuditActorType;
  }

  let action: string | undefined;
  if (q.action !== undefined) {
    if (typeof q.action !== 'string' || q.action.trim().length === 0) {
      throw new BadRequestException('action must be a non-empty string.');
    }
    action = q.action.trim();
  }

  let resourceType: string | undefined;
  if (q.resourceType !== undefined) {
    if (typeof q.resourceType !== 'string' || q.resourceType.trim().length === 0) {
      throw new BadRequestException('resourceType must be a non-empty string.');
    }
    resourceType = q.resourceType.trim();
  }

  let resourceId: string | undefined;
  if (q.resourceId !== undefined) {
    if (typeof q.resourceId !== 'string' || q.resourceId.trim().length === 0) {
      throw new BadRequestException('resourceId must be a non-empty string.');
    }
    resourceId = q.resourceId.trim();
  }

  let severity: AuditSeverity | undefined;
  if (q.severity !== undefined) {
    if (!AUDIT_SEVERITIES.includes(q.severity as AuditSeverity)) {
      throw new BadRequestException(`severity must be one of: ${AUDIT_SEVERITIES.join(', ')}.`);
    }
    severity = q.severity as AuditSeverity;
  }

  let requestId: string | undefined;
  if (q.requestId !== undefined) {
    if (typeof q.requestId !== 'string' || q.requestId.trim().length === 0) {
      throw new BadRequestException('requestId must be a non-empty string.');
    }
    requestId = q.requestId.trim();
  }

  let correlationId: string | undefined;
  if (q.correlationId !== undefined) {
    if (typeof q.correlationId !== 'string' || q.correlationId.trim().length === 0) {
      throw new BadRequestException('correlationId must be a non-empty string.');
    }
    correlationId = q.correlationId.trim();
  }

  let dateFrom: Date | undefined;
  if (q.dateFrom !== undefined) {
    if (typeof q.dateFrom !== 'string' || Number.isNaN(Date.parse(q.dateFrom))) {
      throw new BadRequestException('dateFrom must be a valid ISO date string.');
    }
    dateFrom = new Date(q.dateFrom);
  }

  let dateTo: Date | undefined;
  if (q.dateTo !== undefined) {
    if (typeof q.dateTo !== 'string' || Number.isNaN(Date.parse(q.dateTo))) {
      throw new BadRequestException('dateTo must be a valid ISO date string.');
    }
    dateTo = new Date(q.dateTo);
  }

  if (dateFrom !== undefined && dateTo !== undefined && dateFrom > dateTo) {
    throw new BadRequestException('dateFrom must not be after dateTo.');
  }

  const pageRaw = q.page !== undefined ? Number(q.page) : DEFAULT_PAGE;
  const limitRaw = q.limit !== undefined ? Number(q.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    throw new BadRequestException('page must be a positive integer.');
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT) {
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);
  }

  return {
    filters: {
      ...(actorId !== undefined ? { actorId } : {}),
      ...(actorType !== undefined ? { actorType } : {}),
      ...(action !== undefined ? { action } : {}),
      ...(resourceType !== undefined ? { resourceType } : {}),
      ...(resourceId !== undefined ? { resourceId } : {}),
      ...(severity !== undefined ? { severity } : {}),
      ...(requestId !== undefined ? { requestId } : {}),
      ...(correlationId !== undefined ? { correlationId } : {}),
      ...(dateFrom !== undefined ? { dateFrom } : {}),
      ...(dateTo !== undefined ? { dateTo } : {}),
    },
    page: pageRaw,
    limit: limitRaw,
  };
}
