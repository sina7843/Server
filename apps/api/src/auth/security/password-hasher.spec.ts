import { hashPassword, verifyPassword } from './password-hasher';

describe('password hasher', () => {
  it('produces a non-raw argon2 hash', async () => {
    const password = 'correct horse battery staple';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toContain('argon2id');
  });

  it('accepts the correct password', async () => {
    const passwordHash = await hashPassword('valid-password');

    await expect(verifyPassword('valid-password', passwordHash)).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const passwordHash = await hashPassword('valid-password');

    await expect(verifyPassword('wrong-password', passwordHash)).resolves.toBe(false);
  });

  it('rejects invalid hash input safely', async () => {
    await expect(verifyPassword('password', 'not-a-valid-hash')).resolves.toBe(false);
  });
});
