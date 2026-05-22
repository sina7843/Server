import { CONTENT_STATUSES, type ContentStatus } from '@dragon/types';

export function isValidContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}

export function assertValidContentStatus(value: string): asserts value is ContentStatus {
  if (!isValidContentStatus(value)) {
    throw new Error(
      `Invalid content status: "${value}". Must be one of: ${CONTENT_STATUSES.join(', ')}.`,
    );
  }
}
