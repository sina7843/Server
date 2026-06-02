import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

const KNOWN_CREATE_FIELDS = new Set([
  'winnerId',
  'participant1Score',
  'participant2Score',
  'notes',
]);
const KNOWN_UPDATE_FIELDS = new Set([
  'winnerId',
  'participant1Score',
  'participant2Score',
  'notes',
]);

export interface ParsedCreateResult {
  readonly winnerId: Types.ObjectId;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
  readonly notes?: string;
}

export interface ParsedUpdateResult {
  readonly winnerId: Types.ObjectId;
  readonly participant1Score?: number;
  readonly participant2Score?: number;
  readonly notes?: string;
}

function parseRequiredObjectId(value: unknown, field: string): Types.ObjectId {
  if (typeof value !== 'string' || !value) {
    throw new BadRequestException(`${field} is required and must be a non-empty string.`);
  }
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`${field} must be a valid ObjectId.`);
  }
  return new Types.ObjectId(value);
}

function parseOptionalScore(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${field} must be a non-negative number.`);
  }
  return value;
}

function parseOptionalNotes(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BadRequestException('notes must be a string.');
  return value;
}

export function parseCreateResultBody(raw: unknown): ParsedCreateResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_CREATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const p1Score = parseOptionalScore(body.participant1Score, 'participant1Score');
  const p2Score = parseOptionalScore(body.participant2Score, 'participant2Score');
  const notes = parseOptionalNotes(body.notes);

  const result: ParsedCreateResult = {
    winnerId: parseRequiredObjectId(body.winnerId, 'winnerId'),
    ...(p1Score !== undefined && { participant1Score: p1Score }),
    ...(p2Score !== undefined && { participant2Score: p2Score }),
    ...(notes !== undefined && { notes }),
  };

  return result;
}

export function parseUpdateResultBody(raw: unknown): ParsedUpdateResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  const p1Score = parseOptionalScore(body.participant1Score, 'participant1Score');
  const p2Score = parseOptionalScore(body.participant2Score, 'participant2Score');
  const notes = parseOptionalNotes(body.notes);

  const result: ParsedUpdateResult = {
    winnerId: parseRequiredObjectId(body.winnerId, 'winnerId'),
    ...(p1Score !== undefined && { participant1Score: p1Score }),
    ...(p2Score !== undefined && { participant2Score: p2Score }),
    ...(notes !== undefined && { notes }),
  };

  return result;
}
