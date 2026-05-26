import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * CSRF defense-in-depth for cookie-auth state-changing endpoints (refresh).
 *
 * SameSite=Strict already blocks cross-site cookie submission in modern browsers.
 * This guard adds an Origin/Referer header check as an additional layer:
 *
 * - If CORS_ALLOWED_ORIGINS is unset (dev/test) → always passes.
 * - If an Origin header is present → it must be in the allowlist.
 * - If no Origin but a Referer header is present → the Referer origin must be in the allowlist.
 * - If neither header is present → passes (server-to-server, CLI, mobile clients without browser CORS).
 *
 * Bearer-token API clients are unaffected: they do not call cookie-based refresh endpoints.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const allowedOrigins = resolveAllowedOrigins();

    if (allowedOrigins.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();

    const origin = readHeader(request, 'origin');
    const referer = readHeader(request, 'referer');

    if (origin !== undefined) {
      if (!allowedOrigins.includes(origin)) {
        throw new ForbiddenException('Origin not allowed.');
      }
      return true;
    }

    if (referer !== undefined) {
      const refererOrigin = extractOriginFromUrl(referer);

      if (refererOrigin !== null && !allowedOrigins.includes(refererOrigin)) {
        throw new ForbiddenException('Origin not allowed.');
      }
      return true;
    }

    return true;
  }
}

function resolveAllowedOrigins(): string[] {
  const raw = process.env['CORS_ALLOWED_ORIGINS'];
  if (!raw || raw.trim().length === 0) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractOriginFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function readHeader(
  request: { headers?: Record<string, string | string[] | undefined> },
  headerName: string,
): string | undefined {
  const value = request.headers?.[headerName];
  if (Array.isArray(value)) return value[0];
  return value;
}
