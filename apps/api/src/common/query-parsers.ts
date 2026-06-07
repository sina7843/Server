/**
 * Lenient optional boolean query parser — backward-compatible.
 *
 * undefined, null, '' → undefined (absent, no filter applied)
 * 'true'              → true
 * 'false'             → false
 * array (any)         → undefined (duplicate query params silently dropped)
 * any other value     → undefined (silently ignored, not rejected)
 *
 * Arrays are handled explicitly so that duplicate query params such as
 * ?registrationOpen=true&registrationOpen=true (parsed by qs as ['true','true'])
 * are treated as "not provided" rather than falling through accidentally.
 *
 * Do not introduce strict validation here without explicit approval and a separate helper.
 */
export function parseOptionalBooleanQuery(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
