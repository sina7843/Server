import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AUTH_CONFIG } from '../../config/app-config.module';
import type { AuthConfig } from '../../config/auth.config';
import { hashToken } from '../security/token-hasher';
import type { RefreshTokenIssueResult } from './token.types';

const REFRESH_TOKEN_BYTES = 48;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
  constructor(@Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig) {}

  issueRefreshToken(now = new Date()): RefreshTokenIssueResult {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');

    return {
      refreshToken,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now.getTime() + this.authConfig.refreshTokenTtlDays * DAY_IN_MS),
    };
  }
}
