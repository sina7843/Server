import { argon2id, hash, verify } from 'argon2';

const PASSWORD_HASH_OPTIONS = {
  memoryCost: 19456,
  parallelism: 1,
  timeCost: 2,
  type: argon2id,
};

export async function hashPassword(password: string): Promise<string> {
  if (password.length === 0) {
    throw new Error('Password is required.');
  }

  return hash(password, PASSWORD_HASH_OPTIONS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (password.length === 0 || passwordHash.length === 0) {
    return false;
  }

  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
