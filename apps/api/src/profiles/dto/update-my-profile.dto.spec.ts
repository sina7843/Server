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
      }),
    ).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      bio: 'Bio',
      visibility: 'private',
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

  it('rejects avatarMediaId as a forbidden internal field', () => {
    expect(() => validateUpdateMyProfileDto({ avatarMediaId: '64f000000000000000000123' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects avatarMediaId set to null as a forbidden field', () => {
    expect(() => validateUpdateMyProfileDto({ avatarMediaId: null })).toThrow(BadRequestException);
  });

  it('accepts an empty object (no-op update)', () => {
    expect(validateUpdateMyProfileDto({})).toEqual({});
  });

  it('rejects unknown fields that are not internal', () => {
    expect(() => validateUpdateMyProfileDto({ favoriteColor: 'blue' })).toThrow(
      BadRequestException,
    );
  });
});
