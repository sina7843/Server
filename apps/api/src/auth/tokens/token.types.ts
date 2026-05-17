export interface AccessTokenClaims {
  readonly sub: string;
  readonly jti: string;
  readonly sessionId?: string;
}

export interface VerifiedAccessTokenClaims {
  readonly sub: string;
  readonly jti: string;
  readonly sessionId?: string;
}

export interface IssuedAccessToken {
  readonly accessToken: string;
  readonly jti: string;
  readonly expiresIn: number;
}

export interface RefreshTokenIssueResult {
  readonly refreshToken: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
}
