const PHONE_SEPARATOR_PATTERN = /[\s().\-\u2010-\u2015]/g;
const NORMALIZED_PHONE_PATTERN = /^\+?\d{7,15}$/;

export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error('Phone number is required.');
  }

  const withoutSeparators = trimmed.replace(PHONE_SEPARATOR_PATTERN, '');
  const plusMatches = withoutSeparators.match(/\+/g) ?? [];

  if (plusMatches.length > 1 || (plusMatches.length === 1 && !withoutSeparators.startsWith('+'))) {
    throw new Error('Phone number has an invalid plus sign placement.');
  }

  const digits = withoutSeparators.startsWith('+') ? withoutSeparators.slice(1) : withoutSeparators;

  if (!/^\d+$/.test(digits)) {
    throw new Error('Phone number contains invalid characters.');
  }

  if (digits.length < 7 || digits.length > 15) {
    throw new Error('Phone number length is invalid.');
  }

  const normalized = withoutSeparators.startsWith('+') ? `+${digits}` : digits;

  if (!isLikelyNormalizedPhone(normalized)) {
    throw new Error('Phone number could not be normalized.');
  }

  return normalized;
}

export function isLikelyNormalizedPhone(value: string): boolean {
  return NORMALIZED_PHONE_PATTERN.test(value);
}
