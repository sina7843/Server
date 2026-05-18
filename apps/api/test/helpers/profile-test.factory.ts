import type { ProfileUserLike, UserProfileLike } from '../../src/profiles/profile.types';

export function createProfileTestUser(overrides: Partial<ProfileUserLike> = {}): ProfileUserLike {
  return {
    _id: '64f000000000000000000001',
    status: 'active',
    phoneVerifiedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createProfileTestProfile(
  overrides: Partial<UserProfileLike> = {},
): UserProfileLike {
  return {
    _id: '64f000000000000000000101',
    userId: '64f000000000000000000001',
    username: 'dragon',
    usernameNormalized: 'dragon',
    displayName: 'Dragon',
    visibility: 'public',
    publicUrl: '/u/dragon',
    ...overrides,
  };
}
