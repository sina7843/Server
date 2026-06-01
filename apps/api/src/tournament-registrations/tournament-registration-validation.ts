import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import type { TournamentRegistrationType } from '@dragon/types';
import type { RegistrationMemberInput } from './tournament-registration.types';

// ─── Registration type ────────────────────────────────────────────────────────

const VALID_REGISTRATION_TYPES = new Set<TournamentRegistrationType>(['individual', 'team']);

export function assertRegistrationType(type: unknown): asserts type is TournamentRegistrationType {
  if (
    typeof type !== 'string' ||
    !VALID_REGISTRATION_TYPES.has(type as TournamentRegistrationType)
  ) {
    throw new BadRequestException(
      `Registration type must be "individual" or "team". Received: "${String(type)}".`,
    );
  }
}

// ─── Team name ────────────────────────────────────────────────────────────────

export function assertTeamName(teamName: unknown): asserts teamName is string {
  if (typeof teamName !== 'string' || teamName.trim().length === 0) {
    throw new BadRequestException('teamName is required for team registrations.');
  }
  if (teamName.trim().length > 100) {
    throw new BadRequestException('teamName must not exceed 100 characters.');
  }
}

// ─── Team members ─────────────────────────────────────────────────────────────

export function assertTeamMembers(members: unknown): asserts members is RegistrationMemberInput[] {
  if (!Array.isArray(members)) {
    throw new BadRequestException('members must be an array for team registrations.');
  }
  for (let i = 0; i < members.length; i++) {
    const member: unknown = members[i];
    if (typeof member !== 'object' || member === null) {
      throw new BadRequestException(`members[${i}] must be an object.`);
    }
    const m = member as Record<string, unknown>;
    if (typeof m.userId !== 'string' || m.userId.trim().length === 0) {
      throw new BadRequestException(`members[${i}].userId is required.`);
    }
    if (typeof m.displayName !== 'string' || m.displayName.trim().length === 0) {
      throw new BadRequestException(`members[${i}].displayName is required.`);
    }
    if (m.displayName.trim().length > 100) {
      throw new BadRequestException(`members[${i}].displayName must not exceed 100 characters.`);
    }
    if (m.role !== undefined && (typeof m.role !== 'string' || m.role.trim().length === 0)) {
      throw new BadRequestException(`members[${i}].role must be a non-empty string when provided.`);
    }
    // Privacy guard: no phone or email in member data.
    const forbidden = ['phone', 'phoneNumber', 'email', 'password', 'token'];
    for (const key of forbidden) {
      if (m[key] !== undefined) {
        throw new BadRequestException(`members[${i}].${key} is not allowed.`);
      }
    }
  }
}

// ─── Update body ──────────────────────────────────────────────────────────────

export function assertUpdateIsNotEmpty(teamName: string | undefined, members: unknown): void {
  if (teamName === undefined && members === undefined) {
    throw new UnprocessableEntityException(
      'Update body must include at least teamName or members.',
    );
  }
}
