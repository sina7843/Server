export interface PasswordResetTokenClaims {
  readonly sub: string;
  readonly purpose: 'password_reset';
  readonly jti: string;
  readonly exp: number;
}

export interface VerifyPasswordResetOtpResult {
  readonly resetToken: string;
}
