import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserProfileService } from './profile.service';

const publicProfile = {
  _id: 'profile-id',
  userId: 'user-1',
  username: 'dragon',
  usernameNormalized: 'dragon',
  displayName: 'Dragon',
  bio: 'Bio',
  visibility: 'public',
  publicUrl: '/u/dragon',
};

describe('UserProfileService API methods', () => {
  it('GET public profile returns visible active public profile', async () => {
    const service = new UserProfileService(
      {
        findByUsernameNormalized: jest.fn().mockResolvedValue(publicProfile),
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          status: 'active',
          phoneVerifiedAt: new Date(),
        }),
      } as never,
      {
        evaluatePublicAccess: jest.fn().mockReturnValue({ state: 'visible' }),
      } as never,
    );

    await expect(service.getPublicProfileByUsername('Dragon')).resolves.toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      bio: 'Bio',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
  });

  it('GET public profile lookup is case-insensitive', async () => {
    const findByUsernameNormalized = jest.fn().mockResolvedValue(null);
    const service = new UserProfileService(
      { findByUsernameNormalized } as never,
      { findById: jest.fn() } as never,
      { evaluatePublicAccess: jest.fn() } as never,
    );

    await service.getPublicProfileByUsername('Dragon');

    expect(findByUsernameNormalized).toHaveBeenCalledWith('dragon');
  });

  it('returns private state without hidden fields for private profile', async () => {
    const service = new UserProfileService(
      {
        findByUsernameNormalized: jest.fn().mockResolvedValue(publicProfile),
      } as never,
      { findById: jest.fn().mockResolvedValue({ status: 'active' }) } as never,
      {
        evaluatePublicAccess: jest.fn().mockReturnValue({ state: 'private' }),
      } as never,
    );

    const response = await service.getPublicProfileByUsername('dragon');

    expect(response).toEqual({ state: 'private' });
    expect(response).not.toHaveProperty('bio');
    expect(response).not.toHaveProperty('avatarMediaId');
    expect(response).not.toHaveProperty('displayName');
  });

  it.each([
    ['pending_verification', 'private'],
    ['suspended', 'private'],
    ['banned', 'not_found'],
    ['deleted', 'not_found'],
  ])('does not expose meaningful data for %s user', async (status, state) => {
    const service = new UserProfileService(
      {
        findByUsernameNormalized: jest.fn().mockResolvedValue(publicProfile),
      } as never,
      { findById: jest.fn().mockResolvedValue({ status }) } as never,
      {
        evaluatePublicAccess: jest.fn().mockReturnValue({ state }),
      } as never,
    );

    await expect(service.getPublicProfileByUsername('dragon')).resolves.toEqual(
      state === 'private' ? { state: 'private' } : { state: 'not_found' },
    );
  });

  it('GET my profile returns own safe profile without sensitive fields', async () => {
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue({
        ...publicProfile,
        phone: '+989121234567',
        email: 'user@example.com',
        passwordHash: 'hash',
        token: 'token',
        session: {},
      }),
    } as never);

    const response = await service.getMyProfile('user-1');

    expect(response).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      bio: 'Bio',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
    expect(response).not.toHaveProperty('phone');
    expect(response).not.toHaveProperty('email');
    expect(response).not.toHaveProperty('passwordHash');
    expect(response).not.toHaveProperty('token');
    expect(response).not.toHaveProperty('session');
  });

  it('PATCH my profile rejects duplicate username case-insensitively', async () => {
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue(publicProfile),
      isUsernameTaken: jest.fn().mockResolvedValue(true),
    } as never);

    await expect(
      service.updateMyProfile('user-1', { username: 'Dragon' }),
    ).rejects.toThrow(ConflictException);
  });

  it('PATCH my profile rejects invalid avatarMediaId safely instead of causing ObjectId runtime errors', async () => {
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue(publicProfile),
      isUsernameTaken: jest.fn().mockResolvedValue(false),
      updateProfile: jest.fn(),
    } as never);

    await expect(
      service.updateMyProfile('user-1', { avatarMediaId: 'not-an-object-id' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('PATCH my profile updates usernameNormalized and publicUrl', async () => {
    const updateProfile = jest.fn().mockResolvedValue({
      ...publicProfile,
      username: 'DragonTwo',
      usernameNormalized: 'dragontwo',
      publicUrl: '/u/dragontwo',
    });
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue(publicProfile),
      isUsernameTaken: jest.fn().mockResolvedValue(false),
      updateProfile,
    } as never);

    await service.updateMyProfile('user-1', { username: 'DragonTwo' });

    expect(updateProfile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        username: 'DragonTwo',
        usernameNormalized: 'dragontwo',
        publicUrl: '/u/dragontwo',
      }),
    );
  });

  it('PATCH my profile validates reserved and unsafe usernames', async () => {
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue(publicProfile),
    } as never);

    await expect(
      service.updateMyProfile('user-1', { username: 'admin' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMyProfile('user-1', { username: '../admin' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('PATCH my profile validates displayName, bio length, and visibility', async () => {
    const service = new UserProfileService({
      findByUserId: jest.fn().mockResolvedValue(publicProfile),
      isUsernameTaken: jest.fn().mockResolvedValue(false),
    } as never);

    await expect(
      service.updateMyProfile('user-1', { displayName: ' ' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMyProfile('user-1', { bio: 'a'.repeat(501) }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMyProfile('user-1', { visibility: 'friends' as never }),
    ).rejects.toThrow(BadRequestException);
  });

  it('PATCH my profile enforces own profile update foundation', async () => {
    const service = new UserProfileService(
      {
        findByUserId: jest.fn().mockResolvedValue({
          ...publicProfile,
          userId: 'user-2',
        }),
      } as never,
      undefined,
      { canUpdateOwnProfile: jest.fn().mockReturnValue(false) } as never,
    );

    await expect(
      service.updateMyProfile('user-1', { displayName: 'New Name' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
