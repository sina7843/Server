/** Internal result from login/refresh — includes refreshToken for the controller to set as cookie. */
export interface TokenServiceResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

/** Public API response — refreshToken is NOT included; it is set as an HttpOnly cookie. */
export interface TokenResponseDto {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export function createTokenResponse(input: {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
  readonly expiresIn: number;
}): TokenServiceResult {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    refreshTokenExpiresAt: input.refreshTokenExpiresAt,
    tokenType: 'Bearer',
    expiresIn: input.expiresIn,
  };
}

export function toTokenResponseDto(result: TokenServiceResult): TokenResponseDto {
  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    expiresIn: result.expiresIn,
  };
}
