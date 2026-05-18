import { UserProfileVisibilityService } from './profile-visibility.service';

const objectPolicyService = {
  canAccessOwnResource: jest.fn(({ userId, resourceOwnerId }) => ({
    allowed: userId === resourceOwnerId,
    reason: userId === resourceOwnerId ? 'allowed' : 'ownership_mismatch',
  })),
};

const profile = {
  userId: 'user-1',
  username: 'dragon',
  usernameNormalized: 'dragon',
  displayName: 'Dragon',
  visibility: 'public',
  publicUrl: '/u/dragon',
} as const;

describe('UserProfileVisibilityService', () => {
  const service = new UserProfileVisibilityService(objectPolicyService as never);

  it('allows active + public profile', () => {
    expect(
      service.evaluatePublicAccess({
        user: { status: 'active', phoneVerifiedAt: new Date() },
        profile,
      }),
    ).toEqual({ state: 'visible' });
  });

  it('hides active + private profile', () => {
    expect(
      service.evaluatePublicAccess({
        user: { status: 'active', phoneVerifiedAt: new Date() },
        profile: { ...profile, visibility: 'private' },
      }),
    ).toEqual({ state: 'private' });
  });

  it.each([
    ['pending_verification', 'private'],
    ['suspended', 'private'],
    ['banned', 'not_found'],
    ['deleted', 'not_found'],
  ] as const)('handles %s user as %s', (status, state) => {
    expect(
      service.evaluatePublicAccess({
        user: { status, phoneVerifiedAt: new Date() },
        profile,
      }),
    ).toEqual({ state });
  });

  it('treats missing user/profile as not found', () => {
    expect(service.evaluatePublicAccess({ user: null, profile })).toEqual({
      state: 'not_found',
    });
    expect(
      service.evaluatePublicAccess({
        user: { status: 'active', phoneVerifiedAt: new Date() },
        profile: null,
      }),
    ).toEqual({ state: 'not_found' });
  });

  it('allows same user to update own profile', () => {
    expect(service.canUpdateOwnProfile('user-1', 'user-1')).toBe(true);
  });

  it('denies different user updating profile', () => {
    expect(service.canUpdateOwnProfile('user-1', 'user-2')).toBe(false);
  });
});
