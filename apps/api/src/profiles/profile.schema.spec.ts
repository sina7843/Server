import { UserProfileSchema } from './profile.schema';

describe('UserProfile schema', () => {
  it('declares required fields', () => {
    expect(UserProfileSchema.path('userId').isRequired).toBe(true);
    expect(UserProfileSchema.path('username').isRequired).toBe(true);
    expect(UserProfileSchema.path('usernameNormalized').isRequired).toBe(true);
    expect(UserProfileSchema.path('displayName').isRequired).toBe(true);
    expect(UserProfileSchema.path('publicUrl').isRequired).toBe(true);
  });

  it('declares required indexes', () => {
    const indexes = UserProfileSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ userId: 1 }, expect.objectContaining({ unique: true })],
        [{ usernameNormalized: 1 }, expect.objectContaining({ unique: true })],
        [{ visibility: 1 }, expect.any(Object)],
        [{ createdAt: 1 }, expect.any(Object)],
      ]),
    );
  });
});
