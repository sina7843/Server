const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /credential/i,
  /\bkey\b/i,
  /\botp\b/i,
  /authorization/i,
  /cookie/i,
];

const SAFE_REPLACEMENT = 'Provider error occurred.';
const MAX_ERROR_LENGTH = 500;

export function sanitizeNotificationErrorMessage(message: string): string {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return SAFE_REPLACEMENT;
    }
  }
  return message.slice(0, MAX_ERROR_LENGTH);
}
