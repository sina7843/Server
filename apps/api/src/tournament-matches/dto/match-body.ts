import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { CreateMatchInput, UpdateMatchInput } from '../tournament-match.types';

const KNOWN_CREATE_FIELDS = new Set([
  'round',
  'matchNumber',
  'participant1Id',
  'participant2Id',
  'scheduledAt',
]);

const KNOWN_UPDATE_FIELDS = new Set(['participant1Id', 'participant2Id', 'scheduledAt', 'notes']);

function parseOptionalObjectId(value: unknown, field: string): Types.ObjectId | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string.`);
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`${field} must be a valid ObjectId.`);
  }
  return new Types.ObjectId(value);
}

function parseOptionalNullableObjectId(
  value: unknown,
  field: string,
): Types.ObjectId | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string')
    throw new BadRequestException(`${field} must be a string or null.`);
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`${field} must be a valid ObjectId.`);
  }
  return new Types.ObjectId(value);
}

function parseOptionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string')
    throw new BadRequestException(`${field} must be an ISO date string.`);
  const d = new Date(value);
  if (isNaN(d.getTime()))
    throw new BadRequestException(`${field} must be a valid ISO date string.`);
  return d;
}

function parseOptionalNullableDate(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string')
    throw new BadRequestException(`${field} must be an ISO date string or null.`);
  const d = new Date(value);
  if (isNaN(d.getTime()))
    throw new BadRequestException(`${field} must be a valid ISO date string.`);
  return d;
}

export function parseCreateMatchBody(raw: unknown): CreateMatchInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (typeof body.round !== 'number' || !Number.isInteger(body.round) || body.round < 1) {
    throw new BadRequestException('round is required and must be a positive integer.');
  }

  if (
    typeof body.matchNumber !== 'number' ||
    !Number.isInteger(body.matchNumber) ||
    body.matchNumber < 1
  ) {
    throw new BadRequestException('matchNumber is required and must be a positive integer.');
  }

  const p1 = parseOptionalObjectId(body.participant1Id, 'participant1Id');
  const p2 = parseOptionalObjectId(body.participant2Id, 'participant2Id');
  const scheduledAt = parseOptionalDate(body.scheduledAt, 'scheduledAt');

  return {
    round: body.round,
    matchNumber: body.matchNumber,
    ...(p1 && { participant1Id: p1 }),
    ...(p2 && { participant2Id: p2 }),
    ...(scheduledAt && { scheduledAt }),
  };
}

export function parseUpdateMatchBody(raw: unknown): UpdateMatchInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const result: Record<string, unknown> = {};

  if ('participant1Id' in body) {
    result.participant1Id = parseOptionalNullableObjectId(body.participant1Id, 'participant1Id');
  }
  if ('participant2Id' in body) {
    result.participant2Id = parseOptionalNullableObjectId(body.participant2Id, 'participant2Id');
  }
  if ('scheduledAt' in body) {
    result.scheduledAt = parseOptionalNullableDate(body.scheduledAt, 'scheduledAt');
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') throw new BadRequestException('notes must be a string.');
    result.notes = body.notes;
  }

  return result as UpdateMatchInput;
}
