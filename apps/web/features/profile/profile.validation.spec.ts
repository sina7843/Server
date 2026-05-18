import {
  validateBio,
  validateDisplayName,
  validateProfileUpdate,
  validateUsername,
  validateVisibility,
} from './profile.validation';

describe('profile validation', () => {
  it('accepts safe username', () => {
    expect(validateUsername('dragon_user-01')).toBeNull();
  });

  it('rejects reserved and unsafe usernames', () => {
    expect(validateUsername('admin')).toContain('reserved');
    expect(validateUsername('dragon user')).toContain('letters');
    expect(validateUsername('dragon/user')).toContain('letters');
    expect(validateUsername('dragon?user')).toContain('letters');
    expect(validateUsername('dragon#user')).toContain('letters');
  });

  it('validates displayName', () => {
    expect(validateDisplayName('Dragon')).toBeNull();
    expect(validateDisplayName(' ')).toContain('required');
  });

  it('validates bio length', () => {
    expect(validateBio('Short bio')).toBeNull();
    expect(validateBio('a'.repeat(501))).toContain('Bio');
  });

  it('validates visibility public/private', () => {
    expect(validateVisibility('public')).toBeNull();
    expect(validateVisibility('private')).toBeNull();
    expect(validateVisibility('friends' as never)).toContain('Visibility');
  });

  it('validates full update payload', () => {
    expect(
      validateProfileUpdate({
        username: 'dragon',
        displayName: 'Dragon',
        bio: 'Bio',
        visibility: 'public',
        avatarMediaId: null,
      }),
    ).toEqual({ valid: true, errors: {} });
  });
});
