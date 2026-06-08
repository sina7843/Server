import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvFile(path: string): Record<string, string> {
  const output: Record<string, string> = {};
  const body = readFileSync(path, 'utf8');

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

export function loadLocalEnv(): void {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, '../../.env.example'),
    resolve(cwd, '.env.example'),
    resolve(cwd, '.env'),
    resolve(cwd, '.env.local'),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;

    const parsed = parseEnvFile(file);
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
