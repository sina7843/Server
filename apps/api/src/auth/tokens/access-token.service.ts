import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_CONFIG } from '../../config/app-config.module';
import type { AuthConfig } from '../../config/auth.config';
import type {
  AccessTokenClaims,
  IssuedAccessToken,
  VerifiedAccessTokenClaims,
} from './token.types';

const JWT_HEADER = {
  alg: 'HS256',
  typ: 'JWT',
} as const;

@Injectable()
export class AccessTokenService {
  constructor(@Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig) {}

  issueAccessToken(input: AccessTokenClaims): IssuedAccessToken {
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const expiresIn = this.authConfig.accessTokenTtlSeconds;
    const payload = buildAccessTokenPayload(input, issuedAtSeconds, expiresIn);
    const encodedHeader = base64UrlJson(JWT_HEADER);
    const encodedPayload = base64UrlJson(payload);
    const signature = signJwt(`${encodedHeader}.${encodedPayload}`, this.authConfig.jwtSecret);

    return {
      accessToken: `${encodedHeader}.${encodedPayload}.${signature}`,
      jti: input.jti,
      expiresIn,
    };
  }

  verifyAccessToken(accessToken: string, now = new Date()): VerifiedAccessTokenClaims {
    const segments = accessToken.split('.');

    if (segments.length !== 3) {
      throw createInvalidTokenError();
    }

    const [encodedHeader, encodedPayload, signature] = segments;

    if (!encodedHeader || !encodedPayload || !signature) {
      throw createInvalidTokenError();
    }

    const expectedSignature = signJwt(
      `${encodedHeader}.${encodedPayload}`,
      this.authConfig.jwtSecret,
    );

    if (!safeEqual(signature, expectedSignature)) {
      throw createInvalidTokenError();
    }

    const header = parseJwtPart(encodedHeader);
    const payload = parseJwtPart(encodedPayload);

    if (header.alg !== JWT_HEADER.alg || header.typ !== JWT_HEADER.typ) {
      throw createInvalidTokenError();
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const jti = typeof payload.jti === 'string' ? payload.jti : null;
    const exp = typeof payload.exp === 'number' ? payload.exp : null;
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : undefined;

    if (!sub || !jti || exp === null) {
      throw createInvalidTokenError();
    }

    if (exp <= Math.floor(now.getTime() / 1000)) {
      throw createInvalidTokenError();
    }

    return buildVerifiedClaims(sessionId === undefined ? { sub, jti } : { sub, jti, sessionId });
  }

  createJti(): string {
    return randomUUID();
  }
}

function buildAccessTokenPayload(
  input: AccessTokenClaims,
  issuedAtSeconds: number,
  expiresIn: number,
): Record<string, number | string> {
  const payload: Record<string, number | string> = {
    sub: input.sub,
    jti: input.jti,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + expiresIn,
  };

  if (input.sessionId !== undefined) {
    payload.sessionId = input.sessionId;
  }

  return payload;
}

function buildVerifiedClaims(input: {
  readonly sub: string;
  readonly jti: string;
  readonly sessionId?: string;
}): VerifiedAccessTokenClaims {
  return input.sessionId === undefined
    ? {
        sub: input.sub,
        jti: input.jti,
      }
    : {
        sub: input.sub,
        jti: input.jti,
        sessionId: input.sessionId,
      };
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function signJwt(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data, 'utf8').digest('base64url');
}

function parseJwtPart(value: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    throw createInvalidTokenError();
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createInvalidTokenError(): UnauthorizedException {
  return new UnauthorizedException('Invalid access token.');
}
