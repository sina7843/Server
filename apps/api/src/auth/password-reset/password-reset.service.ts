import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_CONFIG } from '../../config/app-config.module';
import type { AuthConfig } from '../../config/auth.config';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import type { VerifyResetOtpDto, VerifyResetOtpResponseDto } from '../dto/verify-reset-otp.dto';
import {
  createGenericAuthResponse,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  RESET_PASSWORD_GENERIC_MESSAGE,
  type AuthGenericResponseDto,
} from '../dto/auth-response.dto';
import { OtpChallengeRepository } from '../otp/otp.repository';
import { OtpChallengeService } from '../otp/otp.service';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from '../security/otp-code';
import { hashPassword } from '../security/password-hasher';
import { normalizePhoneNumber } from '../security/phone-normalizer';
import { SessionRepository } from '../sessions/session.repository';
import { SmsService } from '../sms/sms.service';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import type { UserStatusState } from '../users/user.types';
import type { PasswordResetTokenClaims } from './password-reset.types';

const PASSWORD_RESET_PURPOSE = 'password_reset' as const;
const INVALID_RESET_OTP_MESSAGE = 'Password reset verification could not be completed.';
const INVALID_RESET_TOKEN_MESSAGE = 'Password reset could not be completed.';
const JWT_HEADER = {
  alg: 'HS256',
  typ: 'JWT',
} as const;

export interface PasswordResetRequestMetadata {
  readonly requestId?: string;
  readonly ip?: string;
  readonly userAgent?: string;
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly otpChallengeRepository: OtpChallengeRepository,
    private readonly otpChallengeService: OtpChallengeService,
    private readonly smsService: SmsService,
    private readonly sessionRepository: SessionRepository,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
  ) {}

  async forgotPassword(
    input: ForgotPasswordDto,
    metadata: PasswordResetRequestMetadata = {},
  ): Promise<AuthGenericResponseDto> {
    const phoneNormalized = this.normalizePhone(input.phone);
    const user = await this.userRepository.findActiveByPhoneNormalized(phoneNormalized);
    const now = new Date();

    if (!user || !this.isEligibleForPasswordReset(user, now)) {
      return createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE);
    }

    const otpRequestAllowed = await this.isOtpRequestAllowed(
      phoneNormalized,
      PASSWORD_RESET_PURPOSE,
      metadata,
      now,
    );

    if (!otpRequestAllowed) {
      return createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE);
    }

    const latestChallenge = await this.otpChallengeRepository.findLatestActiveByPhoneAndPurpose(
      phoneNormalized,
      PASSWORD_RESET_PURPOSE,
      now,
    );

    if (latestChallenge && !this.otpChallengeService.canResend(latestChallenge, now)) {
      return createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE);
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    const expiresAt = new Date(now.getTime() + this.authConfig.otpTtlSeconds * 1000);
    const nextResendAt = this.otpChallengeService.calculateNextResendAt(
      this.authConfig.otpResendCooldownSeconds,
      now,
    );

    await this.otpChallengeRepository.createChallenge({
      phoneNormalized,
      purpose: PASSWORD_RESET_PURPOSE,
      codeHash,
      expiresAt,
      maxAttempts: this.authConfig.otpMaxAttempts,
      nextResendAt,
      ...definedMetadata(metadata),
    });

    await this.smsService.sendSms({
      recipientPhoneNormalized: phoneNormalized,
      message: `Your Dragon password reset code is ${code}.`,
      purpose: PASSWORD_RESET_PURPOSE,
      ...definedSmsMetadata(metadata),
    });

    return createGenericAuthResponse(FORGOT_PASSWORD_GENERIC_MESSAGE);
  }

  async verifyResetOtp(input: VerifyResetOtpDto): Promise<VerifyResetOtpResponseDto> {
    const phoneNormalized = this.normalizePhone(input.phone);
    const now = new Date();
    const challenge = await this.otpChallengeRepository.findLatestActiveByPhoneAndPurpose(
      phoneNormalized,
      PASSWORD_RESET_PURPOSE,
      now,
    );

    if (!challenge || !this.otpChallengeService.canAttemptVerification(challenge, now)) {
      throw this.createInvalidResetOtpError();
    }

    const isCodeValid = await verifyOtpCode(input.code, challenge.codeHash);

    if (!isCodeValid) {
      await this.otpChallengeRepository.incrementAttempts(challenge._id);
      throw this.createInvalidResetOtpError();
    }

    const user = await this.userRepository.findActiveByPhoneNormalized(phoneNormalized);

    if (!user || !this.isEligibleForPasswordReset(user, now)) {
      throw this.createInvalidResetOtpError();
    }

    await this.otpChallengeRepository.markVerified(challenge._id, now);
    await this.otpChallengeRepository.markConsumed(challenge._id, now);

    return {
      resetToken: this.issueResetToken(String(user._id), now),
    };
  }

  async resetPassword(input: ResetPasswordDto): Promise<AuthGenericResponseDto> {
    const claims = this.verifyResetToken(input.resetToken);
    const user = await this.userRepository.findById(claims.sub);
    const now = new Date();

    if (!user || !this.isEligibleForPasswordReset(user, now)) {
      throw this.createInvalidResetTokenError();
    }

    this.assertPasswordPolicy(input.newPassword);

    const passwordHash = await hashPassword(input.newPassword);
    await this.userRepository.updatePasswordHash(user._id, passwordHash);
    await this.userRepository.resetFailedLoginState(user._id);
    await this.sessionRepository.revokeAllForUser(user._id, 'password_reset');

    return createGenericAuthResponse(RESET_PASSWORD_GENERIC_MESSAGE);
  }

  issueResetToken(userId: string, now = new Date()): string {
    const issuedAtSeconds = Math.floor(now.getTime() / 1000);
    const payload: PasswordResetTokenClaims = {
      sub: userId,
      purpose: PASSWORD_RESET_PURPOSE,
      jti: randomUUID(),
      exp: issuedAtSeconds + this.authConfig.passwordResetTokenTtlSeconds,
    };
    const encodedHeader = base64UrlJson(JWT_HEADER);
    const encodedPayload = base64UrlJson(payload);
    const signature = signJwt(`${encodedHeader}.${encodedPayload}`, this.authConfig.jwtSecret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyResetToken(resetToken: string, now = new Date()): PasswordResetTokenClaims {
    const segments = resetToken.split('.');

    if (segments.length !== 3) {
      throw this.createInvalidResetTokenError();
    }

    const [encodedHeader, encodedPayload, signature] = segments;

    if (!encodedHeader || !encodedPayload || !signature) {
      throw this.createInvalidResetTokenError();
    }

    const expectedSignature = signJwt(
      `${encodedHeader}.${encodedPayload}`,
      this.authConfig.jwtSecret,
    );

    if (!safeEqual(signature, expectedSignature)) {
      throw this.createInvalidResetTokenError();
    }

    const header = parseJwtPart(encodedHeader);
    const payload = parseJwtPart(encodedPayload);

    if (header.alg !== JWT_HEADER.alg || header.typ !== JWT_HEADER.typ) {
      throw this.createInvalidResetTokenError();
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const purpose = payload.purpose === PASSWORD_RESET_PURPOSE ? payload.purpose : null;
    const jti = typeof payload.jti === 'string' ? payload.jti : null;
    const exp = typeof payload.exp === 'number' ? payload.exp : null;

    if (!sub || !purpose || !jti || exp === null) {
      throw this.createInvalidResetTokenError();
    }

    if (exp <= Math.floor(now.getTime() / 1000)) {
      throw this.createInvalidResetTokenError();
    }

    return { sub, purpose: PASSWORD_RESET_PURPOSE, jti, exp };
  }

  private async isOtpRequestAllowed(
    phoneNormalized: string,
    purpose: typeof PASSWORD_RESET_PURPOSE,
    metadata: PasswordResetRequestMetadata,
    now: Date,
  ): Promise<boolean> {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const phoneCount = await this.otpChallengeRepository.countRecentChallengesByPhone(
      phoneNormalized,
      purpose,
      since,
    );

    if (phoneCount >= this.authConfig.otpDailyPhoneLimit) {
      return false;
    }

    if (metadata.ip !== undefined) {
      const ipCount = await this.otpChallengeRepository.countRecentChallengesByIp(
        metadata.ip,
        purpose,
        since,
      );

      if (ipCount >= this.authConfig.otpIpLimit) {
        return false;
      }
    }

    return true;
  }

  private isEligibleForPasswordReset(user: UserStatusState, now: Date): boolean {
    return this.userService.canAttemptLogin(user, now);
  }

  private assertPasswordPolicy(password: string): void {
    if (password.length < this.authConfig.passwordMinLength) {
      throw new BadRequestException('Password does not meet the minimum length policy.');
    }
  }

  private normalizePhone(phone: string): string {
    try {
      return normalizePhoneNumber(phone);
    } catch {
      throw new BadRequestException('Phone is invalid.');
    }
  }

  private createInvalidResetOtpError(): BadRequestException {
    return new BadRequestException(INVALID_RESET_OTP_MESSAGE);
  }

  private createInvalidResetTokenError(): UnauthorizedException {
    return new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);
  }
}

function definedMetadata(metadata: PasswordResetRequestMetadata): {
  requestId?: string;
  ip?: string;
  userAgent?: string;
} {
  const result: { requestId?: string; ip?: string; userAgent?: string } = {};

  if (metadata.requestId !== undefined) {
    result.requestId = metadata.requestId;
  }

  if (metadata.ip !== undefined) {
    result.ip = metadata.ip;
  }

  if (metadata.userAgent !== undefined) {
    result.userAgent = metadata.userAgent;
  }

  return result;
}

function definedSmsMetadata(metadata: PasswordResetRequestMetadata): {
  requestId?: string;
} {
  const result: { requestId?: string } = {};

  if (metadata.requestId !== undefined) {
    result.requestId = metadata.requestId;
  }

  return result;
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
    throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
