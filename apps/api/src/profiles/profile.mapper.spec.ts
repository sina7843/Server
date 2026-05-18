import { toMyUserProfileDto, toPublicUserProfileDto } from './profile.mapper';
import type { UserProfileLike } from './profile.types';

const profile: UserProfileLike = {
  _id: 'profile-id',
  userId: 'user-id',
  username: 'dragon',
  usernameNormalized: 'dragon',
  displayName: 'Dragon',
  avatarMediaId: 'media-id',
  bio: 'Profile bio',
  visibility: 'public',
  publicUrl: '/u/dragon',
};

describe('profile mapper', () => {
  it('maps public profile fields safely', () => {
    expect(toPublicUserProfileDto(profile)).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      avatarMediaId: 'media-id',
      bio: 'Profile bio',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
  });

  it('maps own profile fields safely', () => {
    expect(toMyUserProfileDto({ ...profile, visibility: 'private' })).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      avatarMediaId: 'media-id',
      bio: 'Profile bio',
      visibility: 'private',
      publicUrl: '/u/dragon',
    });
  });

  it('does not expose phone, email, passwordHash, token, or session fields', () => {
    const mapped = toMyUserProfileDto({
      ...profile,
      phone: '+989121234567',
      email: 'user@example.com',
      passwordHash: 'hash',
      refreshTokenHash: 'hash',
      session: {},
      token: 'token',
    } as never);

    expect(mapped).not.toHaveProperty('phone');
    expect(mapped).not.toHaveProperty('email');
    expect(mapped).not.toHaveProperty('passwordHash');
    expect(mapped).not.toHaveProperty('refreshTokenHash');
    expect(mapped).not.toHaveProperty('session');
    expect(mapped).not.toHaveProperty('token');
    expect(Object.keys(mapped).sort()).toEqual([
      'avatarMediaId',
      'bio',
      'displayName',
      'publicUrl',
      'username',
      'visibility',
    ]);
  });
});
