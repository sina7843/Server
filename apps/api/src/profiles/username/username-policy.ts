import { normalizeUsername } from './username-normalizer';
import { isReservedUsername } from './reserved-usernames';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export type UsernamePolicyErrorCode =
  | 'username_required'
  | 'username_too_short'
  | 'username_too_long'
  | 'username_invalid_format'
  | 'username_reserved';

export class UsernamePolicyError extends Error {
  constructor(
    readonly code: UsernamePolicyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UsernamePolicyError';
  }
}

export interface UsernamePolicyResult {
  readonly username: string;
  readonly usernameNormalized: string;
}

export function validateUsernamePolicy(input: string): UsernamePolicyResult {
  const username = input.trim();
  const usernameNormalized = normalizeUsername(input);

  if (!usernameNormalized) {
    throw new UsernamePolicyError('username_required', 'Username is required.');
  }

  if (usernameNormalized.length < USERNAME_MIN_LENGTH) {
    throw new UsernamePolicyError(
      'username_too_short',
      `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
    );
  }

  if (usernameNormalized.length > USERNAME_MAX_LENGTH) {
    throw new UsernamePolicyError(
      'username_too_long',
      `Username must be at most ${USERNAME_MAX_LENGTH} characters.`,
    );
  }

  if (!USERNAME_PATTERN.test(usernameNormalized)) {
    throw new UsernamePolicyError(
      'username_invalid_format',
      'Username may contain only letters, numbers, underscores, and hyphens.',
    );
  }

  if (isReservedUsername(usernameNormalized)) {
    throw new UsernamePolicyError('username_reserved', 'This username is reserved.');
  }

  return {
    username,
    usernameNormalized,
  };
}

export { isReservedUsername, normalizeUsername };
