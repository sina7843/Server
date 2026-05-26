import { UnauthorizedException } from '@nestjs/common';

export interface RefreshDto {
  readonly refreshToken: string;
}

/**
 * Extracts the refresh token from the `dragon_refresh` HttpOnly cookie.
 * The cookie header is parsed manually to avoid a cookie-parser dependency.
 */
export function parseRefreshTokenFromCookie(cookieHeader: string | undefined): RefreshDto {
  const token = extractCookieValue(cookieHeader, 'dragon_refresh');

  if (!token) {
    throw new UnauthorizedException('Refresh token is missing.');
  }

  return { refreshToken: token };
}

function extractCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;

  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = pattern.exec(cookieHeader);

  if (!match) return undefined;

  const captured = match[1];
  if (!captured) return undefined;

  try {
    return decodeURIComponent(captured);
  } catch {
    return undefined;
  }
}
