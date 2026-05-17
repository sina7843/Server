export interface TokenResponseDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

export function createTokenResponse(input: {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}): TokenResponseDto {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    tokenType: 'Bearer',
    expiresIn: input.expiresIn,
  };
}
