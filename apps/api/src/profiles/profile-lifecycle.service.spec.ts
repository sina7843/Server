import { UserProfileLifecycleService } from './profile-lifecycle.service';

const activeUser = {
  _id: '64f00000000000000000abcd',
  status: 'active',
  phoneVerifiedAt: new Date('2030-01-01T00:00:00.000Z'),
};

function createService(
  overrides: {
    readonly existingProfile?: unknown;
    readonly user?: unknown;
    readonly usernameAvailable?: (username: string) => boolean;
  } = {},
) {
  const profileRepository = {
    findByUserId: jest.fn().mockResolvedValue(overrides.existingProfile ?? null),
  };
  const profileService = {
    isUsernameAvailable: jest
      .fn()
      .mockImplementation(async (username: string) =>
        overrides.usernameAvailable ? overrides.usernameAvailable(username) : true,
      ),
    createProfile: jest.fn().mockImplementation(async (input) => ({
      _id: 'profile-id',
      usernameNormalized: input.username.toLowerCase(),
      publicUrl: `/u/${input.username.toLowerCase()}`,
      ...input,
    })),
  };
  const userRepository = {
    findById: jest.fn().mockResolvedValue(overrides.user ?? activeUser),
  };

  return {
    service: new UserProfileLifecycleService(
      profileRepository as never,
      profileService as never,
      userRepository as never,
    ),
    profileRepository,
    profileService,
    userRepository,
  };
}

describe('UserProfileLifecycleService', () => {
  it('creates profile when missing for active verified user', async () => {
    const { service, profileService } = createService();

    await expect(
      service.ensureProfileForActiveUser({
        userId: '64f00000000000000000abcd',
      }),
    ).resolves.toMatchObject({
      username: 'user-0000abcd',
      displayName: 'User',
      visibility: 'public',
    });

    expect(profileService.createProfile).toHaveBeenCalledTimes(1);
  });

  it('returns existing profile idempotently', async () => {
    const existingProfile = { _id: 'profile-id', userId: 'user-id' };
    const { service, profileService } = createService({ existingProfile });

    await expect(service.ensureProfileForActiveUser({ userId: 'user-id' })).resolves.toBe(
      existingProfile,
    );

    expect(profileService.createProfile).not.toHaveBeenCalled();
  });

  it('does not create duplicate profile for same user', async () => {
    const existingProfile = { _id: 'profile-id', userId: 'user-id' };
    const { service, profileRepository, profileService } = createService({
      existingProfile,
    });

    await service.ensureProfileForActiveUser({ userId: 'user-id' });
    await service.ensureProfileForActiveUser({ userId: 'user-id' });

    expect(profileRepository.findByUserId).toHaveBeenCalledTimes(2);
    expect(profileService.createProfile).not.toHaveBeenCalled();
  });

  it.each([['pending_verification'], ['suspended'], ['banned'], ['deleted']])(
    'does not create profile for %s user',
    async (status) => {
      const { service, profileService } = createService({
        user: { _id: 'user-id', status, phoneVerifiedAt: new Date() },
      });

      await expect(service.ensureProfileForActiveUser({ userId: 'user-id' })).resolves.toBeNull();

      expect(profileService.createProfile).not.toHaveBeenCalled();
    },
  );

  it('does not create profile for active user without phoneVerifiedAt', async () => {
    const { service, profileService } = createService({
      user: { _id: 'user-id', status: 'active' },
    });

    await expect(service.ensureProfileForActiveUser({ userId: 'user-id' })).resolves.toBeNull();

    expect(profileService.createProfile).not.toHaveBeenCalled();
  });

  it('generated username passes username policy and does not use phone/email', async () => {
    const { service, profileService } = createService();

    await service.ensureProfileForActiveUser({
      userId: '64f00000000000000000abcd',
      phoneNormalized: '+989121234567',
      displayName: 'Example User',
    });

    expect(profileService.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'user-0000abcd',
      }),
    );
    expect(profileService.createProfile.mock.calls[0][0].username).not.toContain('9121234567');
    expect(profileService.createProfile.mock.calls[0][0].username).not.toContain('@');
  });

  it('handles uniqueness collision with deterministic suffix', async () => {
    const { service, profileService } = createService({
      usernameAvailable: (username) => username === 'user-0000abcd-2',
    });

    await service.ensureProfileForActiveUser({
      userId: '64f00000000000000000abcd',
    });

    expect(profileService.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'user-0000abcd-2',
      }),
    );
  });

  it('uses preferred safe username when available', async () => {
    const { service, profileService } = createService();

    await service.ensureProfileForActiveUser({
      userId: '64f00000000000000000abcd',
      preferredUsername: 'Dragon_User',
    });

    expect(profileService.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'Dragon_User',
      }),
    );
  });
});
