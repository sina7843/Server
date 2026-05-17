export interface AuthConfigEnv {
  readonly [key: string]: string | undefined;
}

export interface PositiveIntegerRule {
  readonly min?: number;
  readonly max?: number;
}

export function readRequiredEnv(env: AuthConfigEnv, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export function readPositiveIntegerEnv(
  env: AuthConfigEnv,
  key: string,
  rule: PositiveIntegerRule = {},
): number {
  const rawValue = readRequiredEnv(env, key);
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  if (rule.min !== undefined && parsedValue < rule.min) {
    throw new Error(`${key} must be greater than or equal to ${rule.min}.`);
  }

  if (rule.max !== undefined && parsedValue > rule.max) {
    throw new Error(`${key} must be less than or equal to ${rule.max}.`);
  }

  return parsedValue;
}

export function readStringWithMinLengthEnv(
  env: AuthConfigEnv,
  key: string,
  minLength: number,
): string {
  const value = readRequiredEnv(env, key);

  if (value.length < minLength) {
    throw new Error(`${key} must be at least ${minLength} characters long.`);
  }

  return value;
}

export function readEnumEnv<TValue extends string>(
  env: AuthConfigEnv,
  key: string,
  allowedValues: readonly TValue[],
): TValue {
  const value = readRequiredEnv(env, key);

  if (!allowedValues.includes(value as TValue)) {
    throw new Error(`${key} has an unsupported value.`);
  }

  return value as TValue;
}
