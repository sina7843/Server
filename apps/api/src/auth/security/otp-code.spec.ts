import { generateOtpCode, hashOtpCode, verifyOtpCode } from './otp-code';

describe('OTP code utilities', () => {
  it('generates a numeric code of the expected default length', () => {
    const code = generateOtpCode();

    expect(code).toMatch(/^\d{6}$/);
  });

  it('generates a numeric code with a caller-provided length', () => {
    const code = generateOtpCode(8);

    expect(code).toMatch(/^\d{8}$/);
  });

  it('rejects unsafe OTP lengths', () => {
    expect(() => generateOtpCode(3)).toThrow('between 4 and 10');
    expect(() => generateOtpCode(11)).toThrow('between 4 and 10');
  });

  it('hashes OTP code without returning the raw code', async () => {
    const code = '123456';
    const codeHash = await hashOtpCode(code);

    expect(codeHash).not.toBe(code);
    expect(codeHash).toContain('argon2id');
  });

  it('verifies correct and wrong OTP codes safely', async () => {
    const codeHash = await hashOtpCode('123456');

    await expect(verifyOtpCode('123456', codeHash)).resolves.toBe(true);
    await expect(verifyOtpCode('654321', codeHash)).resolves.toBe(false);
    await expect(verifyOtpCode('not-code', codeHash)).resolves.toBe(false);
  });

  it('rejects invalid OTP hashes safely', async () => {
    await expect(verifyOtpCode('123456', 'not-an-argon2-hash')).resolves.toBe(false);
  });
});
