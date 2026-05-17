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

  it('hashes OTP code without returning the raw code', () => {
    const code = '123456';
    const codeHash = hashOtpCode(code);

    expect(codeHash).not.toBe(code);
  });

  it('verifies correct and wrong OTP codes safely', () => {
    const codeHash = hashOtpCode('123456');

    expect(verifyOtpCode('123456', codeHash)).toBe(true);
    expect(verifyOtpCode('654321', codeHash)).toBe(false);
    expect(verifyOtpCode('not-code', codeHash)).toBe(false);
  });
});
