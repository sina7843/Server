import { isReservedUsername, normalizeUsername, validateUsernamePolicy } from './username-policy';

describe('username policy', () => {
  it('trims input', () => {
    expect(validateUsernamePolicy('  Dragon_User  ')).toEqual({
      username: 'Dragon_User',
      usernameNormalized: 'dragon_user',
    });
  });

  it('lowercases normalized input', () => {
    expect(normalizeUsername('Dragon-User')).toBe('dragon-user');
  });

  it('is deterministic', () => {
    expect(normalizeUsername(' Dragon_User ')).toBe(normalizeUsername(' Dragon_User '));
  });

  it('rejects empty username', () => {
    expect(() => validateUsernamePolicy('   ')).toThrow('Username is required');
  });

  it('rejects username shorter than minimum', () => {
    expect(() => validateUsernamePolicy('ab')).toThrow('at least');
  });

  it('rejects username longer than maximum', () => {
    expect(() => validateUsernamePolicy('a'.repeat(31))).toThrow('at most');
  });

  it('rejects spaces', () => {
    expect(() => validateUsernamePolicy('dragon user')).toThrow('letters, numbers');
  });

  it('rejects slash', () => {
    expect(() => validateUsernamePolicy('dragon/user')).toThrow('letters, numbers');
  });

  it('rejects query and hash chars', () => {
    expect(() => validateUsernamePolicy('dragon?user')).toThrow('letters, numbers');
    expect(() => validateUsernamePolicy('dragon#user')).toThrow('letters, numbers');
  });

  it('rejects dangerous characters', () => {
    expect(() => validateUsernamePolicy('../admin')).toThrow('letters, numbers');
    expect(() => validateUsernamePolicy('<script>')).toThrow('letters, numbers');
  });

  it('rejects reserved usernames case-insensitively', () => {
    expect(isReservedUsername('Admin')).toBe(true);
    expect(() => validateUsernamePolicy('Admin')).toThrow('reserved');
  });

  it('accepts safe username', () => {
    expect(validateUsernamePolicy('dragon-user_01')).toEqual({
      username: 'dragon-user_01',
      usernameNormalized: 'dragon-user_01',
    });
  });
});
