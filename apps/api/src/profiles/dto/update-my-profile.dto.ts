import { BadRequestException } from '@nestjs/common';
import { PROFILE_VISIBILITIES, type ProfileVisibility } from '../profile.types';

const ALLOWED_FIELDS = new Set(['username', 'displayName', 'bio', 'visibility', 'avatarMediaId']);
const FORBIDDEN_FIELDS = new Set([
  'userId',
  'usernameNormalized',
  'publicUrl',
  'createdAt',
  'updatedAt',
  'phone',
  'email',
  'role',
  'roles',
  'permissions',
  'status',
  'token',
  'accessToken',
  'refreshToken',
  'passwordHash',
]);

export class UpdateMyProfileDto {
  readonly username?: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly visibility?: ProfileVisibility;
  readonly avatarMediaId?: string | null;
}

export function validateUpdateMyProfileDto(input: Record<string, unknown>): UpdateMyProfileDto {
  const unknownFields = Object.keys(input).filter((field) => !ALLOWED_FIELDS.has(field));

  if (unknownFields.length > 0) {
    const containsInternalField = unknownFields.some((field) => FORBIDDEN_FIELDS.has(field));

    throw new BadRequestException(
      containsInternalField
        ? 'Internal profile fields are not allowed.'
        : 'Unknown profile fields are not allowed.',
    );
  }

  const output: {
    username?: string;
    displayName?: string;
    bio?: string;
    visibility?: ProfileVisibility;
    avatarMediaId?: string | null;
  } = {};

  if (input.username !== undefined) {
    if (typeof input.username !== 'string') {
      throw new BadRequestException('username must be a string.');
    }

    output.username = input.username;
  }

  if (input.displayName !== undefined) {
    if (typeof input.displayName !== 'string') {
      throw new BadRequestException('displayName must be a string.');
    }

    output.displayName = input.displayName;
  }

  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      throw new BadRequestException('bio must be a string.');
    }

    output.bio = input.bio;
  }

  if (input.visibility !== undefined) {
    if (
      typeof input.visibility !== 'string' ||
      !PROFILE_VISIBILITIES.includes(input.visibility as ProfileVisibility)
    ) {
      throw new BadRequestException('visibility must be public or private.');
    }

    output.visibility = input.visibility as ProfileVisibility;
  }

  if (input.avatarMediaId !== undefined) {
    if (input.avatarMediaId !== null && typeof input.avatarMediaId !== 'string') {
      throw new BadRequestException('avatarMediaId must be a string or null.');
    }

    output.avatarMediaId = input.avatarMediaId;
  }

  return output;
}
