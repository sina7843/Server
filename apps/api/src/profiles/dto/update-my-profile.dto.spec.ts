import { BadRequestException } from '@nestjs/common';
import { validateUpdateMyProfileDto } from './update-my-profile.dto';

describe('validateUpdateMyProfileDto', () => {
  it('accepts allowed fields', () => {
    expect(
      validateUpdateMyProfileDto({
        username: 'dragon',
        displayName: 'Dragon',
        bio: 'Bio',
        visibility: 'private',
        avatarMediaId: null,
      }),
    ).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      bio: 'Bio',
      visibility: 'private',
      avatarMediaId: null,
    });
  });

  it('rejects internal fields', () => {
    expect(() =>
      validateUpdateMyProfileDto({
        userId: 'user-2',
        usernameNormalized: 'admin',
        phone: '+989121234567',
      }),
    ).toThrow(BadRequestException);
  });

  it('validates visibility enum', () => {
    expect(() => validateUpdateMyProfileDto({ visibility: 'friends' })).toThrow(
      BadRequestException,
    );
  });

  it('treats avatarMediaId as string reference or null only', () => {
    expect(validateUpdateMyProfileDto({ avatarMediaId: 'media-id' })).toEqual({
      avatarMediaId: 'media-id',
    });
    expect(validateUpdateMyProfileDto({ avatarMediaId: null })).toEqual({
      avatarMediaId: null,
    });
    expect(() => validateUpdateMyProfileDto({ avatarMediaId: 123 })).toThrow(BadRequestException);
  });
});
