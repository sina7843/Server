export function normalizeUsername(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.toLowerCase();
}
