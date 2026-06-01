import { BadRequestException } from '@nestjs/common';

// ─── Update participant body parser ──────────────────────────────────────────
//
// PATCH accepts only seed and displayName.
// Generic PATCH cannot change participant status — that is enforced by the
// service's assertParticipantIsActive check before any update is applied.

const KNOWN_UPDATE_FIELDS = new Set(['seed', 'displayName']);

export function parseUpdateParticipantBody(raw: unknown): { seed?: number; displayName?: string } {
  if (typeof raw !== 'object' || raw === null) {
    throw new BadRequestException('Request body must be an object.');
  }
  const body = raw as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!KNOWN_UPDATE_FIELDS.has(key)) {
      throw new BadRequestException(`Unknown field: ${key}.`);
    }
  }

  if (body.seed === undefined && body.displayName === undefined) {
    throw new BadRequestException('Update body must include at least seed or displayName.');
  }

  const result: { seed?: number; displayName?: string } = {};

  if (body.seed !== undefined) {
    if (typeof body.seed !== 'number' || !Number.isInteger(body.seed) || body.seed < 1) {
      throw new BadRequestException('seed must be a positive integer.');
    }
    result.seed = body.seed;
  }

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
      throw new BadRequestException('displayName must be a non-empty string.');
    }
    result.displayName = body.displayName.trim();
  }

  return result;
}

// ─── Action body parser (remove / disqualify) ────────────────────────────────
//
// These actions take no input body. Enforce that no unexpected fields leak in.

export function parseParticipantActionBody(raw: unknown): void {
  if (raw !== undefined && raw !== null) {
    if (typeof raw !== 'object') {
      throw new BadRequestException('Request body must be an object or empty.');
    }
  }
}
