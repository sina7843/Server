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
        avatarMediaId: '64f000000000000000000123',
      }),
    ).toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      bio: 'Bio',
      visibility: 'private',
      avatarMediaId: '64f000000000000000000123',
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

  it('accepts avatarMediaId as valid ObjectId string or null only', () => {
    expect(validateUpdateMyProfileDto({ avatarMediaId: '64f000000000000000000123' })).toEqual({
      avatarMediaId: '64f000000000000000000123',
    });
    expect(validateUpdateMyProfileDto({ avatarMediaId: null })).toEqual({
      avatarMediaId: null,
    });
    expect(() => validateUpdateMyProfileDto({ avatarMediaId: 123 })).toThrow(BadRequestException);
  });

  it('rejects invalid avatarMediaId safely instead of allowing a runtime ObjectId error', () => {
    expect(() => validateUpdateMyProfileDto({ avatarMediaId: 'not-an-object-id' })).toThrow(
      BadRequestException,
    );
  });
});
