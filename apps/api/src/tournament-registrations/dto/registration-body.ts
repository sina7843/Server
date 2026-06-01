import { BadRequestException } from '@nestjs/common';
import type {
  TournamentRegistrationInputDto,
  UpdateTournamentRegistrationDto,
} from '@dragon/types';

const KNOWN_REGISTER_FIELDS = new Set(['type', 'teamName', 'members']);
const KNOWN_UPDATE_FIELDS = new Set(['teamName', 'members']);
const KNOWN_MEMBER_FIELDS = new Set(['userId', 'displayName', 'role']);

// ─── Register body parser ─────────────────────────────────────────────────────

export function parseRegisterBody(raw: unknown): TournamentRegistrationInputDto {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_REGISTER_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (typeof body.type !== 'string') {
    throw new BadRequestException('type is required and must be a string.');
  }

  const result: Record<string, unknown> = { type: body.type };

  if (body.teamName !== undefined) {
    if (typeof body.teamName !== 'string') {
      throw new BadRequestException('teamName must be a string.');
    }
    result.teamName = body.teamName;
  }

  if (body.members !== undefined) {
    if (!Array.isArray(body.members)) {
      throw new BadRequestException('members must be an array.');
    }
    for (let i = 0; i < body.members.length; i++) {
      const m: unknown = body.members[i];
      if (typeof m !== 'object' || m === null) {
        throw new BadRequestException(`members[${i}] must be an object.`);
      }
      const obj = m as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (!KNOWN_MEMBER_FIELDS.has(key)) {
          throw new BadRequestException(`Unknown member field: members[${i}].${key}.`);
        }
      }
    }
    result.members = body.members;
  }

  return result as unknown as TournamentRegistrationInputDto;
}

// ─── Update my registration body parser ──────────────────────────────────────

export function parseUpdateMyRegistrationBody(raw: unknown): UpdateTournamentRegistrationDto {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (body.teamName === undefined && body.members === undefined) {
    throw new BadRequestException('Update body must include at least teamName or members.');
  }

  const result: Record<string, unknown> = {};

  if (body.teamName !== undefined) {
    if (typeof body.teamName !== 'string') {
      throw new BadRequestException('teamName must be a string.');
    }
    result.teamName = body.teamName;
  }

  if (body.members !== undefined) {
    if (!Array.isArray(body.members)) {
      throw new BadRequestException('members must be an array.');
    }
    for (let i = 0; i < body.members.length; i++) {
      const m: unknown = body.members[i];
      if (typeof m !== 'object' || m === null) {
        throw new BadRequestException(`members[${i}] must be an object.`);
      }
      const obj = m as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (!KNOWN_MEMBER_FIELDS.has(key)) {
          throw new BadRequestException(`Unknown member field: members[${i}].${key}.`);
        }
      }
    }
    result.members = body.members;
  }

  return result as UpdateTournamentRegistrationDto;
}

// ─── Admin action body (empty body enforcement) ───────────────────────────────

export function parseAdminRegistrationActionBody(raw: unknown): void {
  if (raw !== undefined && raw !== null) {
    if (typeof raw !== 'object') {
      throw new BadRequestException('Request body must be an object or empty.');
    }
  }
}

// ─── Admin reject body parser ─────────────────────────────────────────────────

const KNOWN_REJECT_FIELDS = new Set(['reason']);

export function parseAdminRejectBody(raw: unknown): { reason?: string } {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object') {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_REJECT_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const result: { reason?: string } = {};
  if (body.reason !== undefined) {
    if (typeof body.reason !== 'string') {
      throw new BadRequestException('reason must be a string.');
    }
    result.reason = body.reason.trim();
  }

  return result;
}
