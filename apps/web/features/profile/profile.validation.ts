import type { ProfileValidationResult, ProfileVisibility } from './profile.types';

export const PROFILE_USERNAME_MIN_LENGTH = 3;
export const PROFILE_USERNAME_MAX_LENGTH = 30;
export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;
export const PROFILE_BIO_MAX_LENGTH = 500;

const USERNAME_PATTERN = /^[a-z0-9_-]+$/i;
const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'logout',
  'dashboard',
  'system',
  'settings',
  'account',
  'profile',
  'users',
  'roles',
  'permissions',
  'content',
  'media',
  'audit',
  'search',
  'analytics',
  'health',
  'support',
  'help',
  'about',
  'contact',
  'news',
  'articles',
  'announcements',
  'guides',
  'rules',
  'pages',
  'categories',
  'tags',
  'shop',
  'academy',
  'streaming',
  'robotics',
  'boardgame',
  'tournament',
]);

export function validateUsername(username: string): string | null {
  const value = username.trim();

  if (value.length < PROFILE_USERNAME_MIN_LENGTH) {
    return `Username must be at least ${PROFILE_USERNAME_MIN_LENGTH} characters.`;
  }

  if (value.length > PROFILE_USERNAME_MAX_LENGTH) {
    return `Username must be at most ${PROFILE_USERNAME_MAX_LENGTH} characters.`;
  }

  if (!USERNAME_PATTERN.test(value)) {
    return 'Username may contain only letters, numbers, underscores, and hyphens.';
  }

  if (RESERVED_USERNAMES.has(value.toLowerCase())) {
    return 'This username is reserved.';
  }

  return null;
}

export function validateDisplayName(displayName: string): string | null {
  const value = displayName.trim();

  if (!value) {
    return 'Display name is required.';
  }

  if (value.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${PROFILE_DISPLAY_NAME_MAX_LENGTH} characters.`;
  }

  return null;
}

export function validateBio(bio?: string): string | null {
  if (!bio) {
    return null;
  }

  if (bio.length > PROFILE_BIO_MAX_LENGTH) {
    return `Bio must be at most ${PROFILE_BIO_MAX_LENGTH} characters.`;
  }

  return null;
}

export function validateVisibility(
  visibility: ProfileVisibility,
): string | null {
  if (visibility !== 'public' && visibility !== 'private') {
    return 'Visibility must be public or private.';
  }

  return null;
}

export function validateProfileUpdate(input: {
  readonly username: string;
  readonly displayName: string;
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
  readonly avatarMediaId?: string | null;
}): ProfileValidationResult {
  const errors: Record<string, string> = {};
  const usernameError = validateUsername(input.username);
  const displayNameError = validateDisplayName(input.displayName);
  const bioError = validateBio(input.bio);
  const visibilityError = validateVisibility(input.visibility);

  if (usernameError) {
    errors.username = usernameError;
  }

  if (displayNameError) {
    errors.displayName = displayNameError;
  }

  if (bioError) {
    errors.bio = bioError;
  }

  if (visibilityError) {
    errors.visibility = visibilityError;
  }

  if (
    input.avatarMediaId !== undefined &&
    input.avatarMediaId !== null &&
    typeof input.avatarMediaId !== 'string'
  ) {
    errors.avatarMediaId = 'Avatar media reference must be a string or empty.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
