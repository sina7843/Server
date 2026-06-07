import { BadRequestException } from '@nestjs/common';

/**
 * Parses a raw query string value as an optional boolean.
 * 'true' => true, 'false' => false, undefined => undefined, anything else => 400.
 */
export function parseOptionalBooleanQuery(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestException(`${fieldName} must be "true" or "false".`);
}
