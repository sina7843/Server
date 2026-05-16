export type KnownEnvironment = 'local' | 'development' | 'test' | 'staging' | 'production';

const KNOWN_ENVIRONMENTS: readonly KnownEnvironment[] = [
  'local',
  'development',
  'test',
  'staging',
  'production',
];

export function isKnownEnvironment(value: string): value is KnownEnvironment {
  return KNOWN_ENVIRONMENTS.includes(value as KnownEnvironment);
}

export function normalizeEnvironment(value: string | undefined): KnownEnvironment {
  if (value !== undefined && isKnownEnvironment(value)) {
    return value;
  }

  return 'development';
}
