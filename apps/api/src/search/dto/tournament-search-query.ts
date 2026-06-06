import { BadRequestException } from '@nestjs/common';
import type { TournamentStatus, TournamentFormat } from '@dragon/types';

const PUBLIC_SAFE_STATUSES = new Set<string>([
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
]);

const VALID_FORMATS = new Set<string>(['single_elimination', 'round_robin', 'manual']);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_Q_LENGTH = 200;

export interface ParsedTournamentSearchQuery {
  readonly q?: string;
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  readonly format?: TournamentFormat;
  readonly registrationOpen?: boolean;
  readonly page: number;
  readonly limit: number;
}

export function parseTournamentSearchQuery(raw: unknown): ParsedTournamentSearchQuery {
  const query = raw as Record<string, unknown>;

  let q: string | undefined;
  if (query.q !== undefined && query.q !== '') {
    if (typeof query.q !== 'string') throw new BadRequestException('q must be a string.');
    if (query.q.length > MAX_Q_LENGTH)
      throw new BadRequestException(`q must be at most ${MAX_Q_LENGTH} characters.`);
    q = query.q.trim() || undefined;
  }

  const gameId =
    typeof query.gameId === 'string' && query.gameId.length > 0 ? query.gameId : undefined;

  const status =
    typeof query.status === 'string' && PUBLIC_SAFE_STATUSES.has(query.status)
      ? (query.status as TournamentStatus)
      : undefined;

  const format =
    typeof query.format === 'string' && VALID_FORMATS.has(query.format)
      ? (query.format as TournamentFormat)
      : undefined;

  let registrationOpen: boolean | undefined;
  if (query.registrationOpen !== undefined) {
    if (query.registrationOpen === 'true') registrationOpen = true;
    else if (query.registrationOpen === 'false') registrationOpen = false;
    else throw new BadRequestException('registrationOpen must be "true" or "false".');
  }

  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;

  if (!Number.isInteger(pageRaw) || pageRaw < 1)
    throw new BadRequestException('page must be a positive integer.');
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_LIMIT)
    throw new BadRequestException(`limit must be between 1 and ${MAX_LIMIT}.`);

  return {
    ...(q !== undefined ? { q } : {}),
    ...(gameId !== undefined ? { gameId } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(format !== undefined ? { format } : {}),
    ...(registrationOpen !== undefined ? { registrationOpen } : {}),
    page: pageRaw,
    limit: limitRaw,
  };
}
