import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Types } from 'mongoose';
import { AUTH_CONFIG } from '../config/app-config.module';
import type { AuthConfig } from '../config/auth.config';
import { createMeResponse, type MeResponseDto } from './dto/me-response.dto';
import {
  createAuthSessionsResponse,
  type AuthSessionsResponseDto,
} from './dto/session-response.dto';
import { createTokenResponse, type TokenServiceResult } from './dto/token-response.dto';
import {
  createGenericAuthResponse,
  type AuthGenericResponseDto,
  LOGOUT_ALL_GENERIC_MESSAGE,
  LOGOUT_GENERIC_MESSAGE,
  REVOKE_SESSION_GENERIC_MESSAGE,
  VERIFY_PHONE_GENERIC_MESSAGE,
} from './dto/auth-response.dto';
import type { AuthContext } from './guards/authenticated-request';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { VerifyResetOtpDto, VerifyResetOtpResponseDto } from './dto/verify-reset-otp.dto';
import type { RegisterDto } from './dto/register.dto';
import type { VerifyPhoneDto } from './dto/verify-phone.dto';
import { OtpChallengeRepository } from './otp/otp.repository';
import type { OtpPurpose } from './otp/otp-purpose';
import { OtpChallengeService } from './otp/otp.service';
import { PasswordResetService } from './password-reset/password-reset.service';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from './security/otp-code';
import { hashToken } from './security/token-hasher';
import { hashPassword, verifyPassword } from './security/password-hasher';
import { maskPhone } from './security/masking';
import { normalizePhoneNumber } from './security/phone-normalizer';
import { SessionRepository } from './sessions/session.repository';
import { SmsService } from './sms/sms.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { UserRepository } from './users/user.repository';
import { UserService } from './users/user.service';
import { UserProfileLifecycleService } from '../profiles/profile-lifecycle.service';

const PHONE_VERIFICATION_PURPOSE: OtpPurpose = 'phone_verification';
const INVALID_PHONE_VERIFICATION_MESSAGE = 'Phone verification could not be completed.';
const INVALID_LOGIN_MESSAGE = 'Invalid phone or password.';
const INVALID_REFRESH_MESSAGE = 'Invalid refresh token.';
const INVALID_LOGOUT_MESSAGE = 'Authentication is required.';
const FAILED_LOGIN_LOCK_THRESHOLD = 5;
const FAILED_LOGIN_LOCK_MS = 15 * 60 * 1000;

export interface RequestMetadata {
  readonly requestId?: string;
  readonly ip?: string;
  readonly userAgent?: string;
}

export type RegisterRequestMetadata = RequestMetadata;
export type LoginRequestMetadata = RequestMetadata;

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly otpChallengeRepository: OtpChallengeRepository,
    private readonly otpChallengeService: OtpChallengeService,
    private readonly smsService: SmsService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly sessionRepository: SessionRepository,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetService?: PasswordResetService,
    @Optional()
    private readonly profileLifecycleService?: UserProfileLifecycleService,
    @Optional()
    private readonly auditService?: AuditService,
    @Optional()
    private readonly analyticsService?: AnalyticsService,
  ) {}

  async register(
    input: RegisterDto,
    metadata: RegisterRequestMetadata = {},
  ): Promise<AuthGenericResponseDto> {
    this.assertPasswordPolicy(input.password);

    const phoneNormalized = this.normalizePhone(input.phone);
    const existingUser = await this.userRepository.findByPhoneNormalized(phoneNormalized);

    if (existingUser && !this.userService.isPendingVerification(existingUser)) {
      return createGenericAuthResponse();
    }

    void this.auditService?.log({
      actorType: 'system',
      action: AuditAction.AUTH_REGISTER_REQUESTED,
      resourceType: 'auth',
      severity: 'info',
      metadata: { phoneMasked: maskPhone(phoneNormalized), ...definedMetadata(metadata) },
    });

    if (!existingUser) {
      const passwordHash = await hashPassword(input.password);
      await this.userRepository.createPendingUser({
        phone: input.phone,
        phoneNormalized,
        passwordHash,
      });
    }

    await this.sendPhoneVerificationOtpIfAllowed(phoneNormalized, metadata);

    return createGenericAuthResponse();
  }

  async verifyPhone(input: VerifyPhoneDto): Promise<AuthGenericResponseDto> {
    const phoneNormalized = this.normalizePhone(input.phone);
    const now = new Date();
    const challenge = await this.otpChallengeRepository.findLatestActiveByPhoneAndPurpose(
      phoneNormalized,
      PHONE_VERIFICATION_PURPOSE,
      now,
    );

    if (!challenge || !this.otpChallengeService.canAttemptVerification(challenge, now)) {
      throw this.createInvalidPhoneVerificationError();
    }

    const isCodeValid = await verifyOtpCode(input.code, challenge.codeHash);

    if (!isCodeValid) {
      await this.otpChallengeRepository.incrementAttempts(challenge._id);
      void this.auditService?.log({
        actorType: 'system',
        action: AuditAction.OTP_FAILED,
        resourceType: 'auth',
        severity: 'warning',
        metadata: {
          phoneMasked: maskPhone(phoneNormalized),
          purpose: PHONE_VERIFICATION_PURPOSE,
        },
      });
      this.analyticsService?.track({ type: 'otp.failed' });
      throw this.createInvalidPhoneVerificationError();
    }

    const user = await this.userRepository.findByPhoneNormalized(phoneNormalized);

    if (!user || !this.userService.canCompletePhoneVerification(user, now)) {
      throw this.createInvalidPhoneVerificationError();
    }

    await this.otpChallengeRepository.markVerified(challenge._id, now);
    await this.otpChallengeRepository.markConsumed(challenge._id, now);
    await this.userRepository.markPhoneVerified(user._id, now);
    void this.auditService?.log({
      actorId: String(user._id),
      actorType: 'user',
      action: AuditAction.OTP_VERIFIED,
      resourceType: 'auth',
      resourceId: String(user._id),
      severity: 'info',
      metadata: { purpose: PHONE_VERIFICATION_PURPOSE },
    });
    this.analyticsService?.track({ type: 'otp.verified', userId: String(user._id) });
    this.analyticsService?.track({ type: 'user.registered', userId: String(user._id) });
    await this.profileLifecycleService?.ensureProfileForActiveUser({
      userId: String(user._id),
    });

    return createGenericAuthResponse(VERIFY_PHONE_GENERIC_MESSAGE);
  }

  async login(input: LoginDto, metadata: LoginRequestMetadata = {}): Promise<TokenServiceResult> {
    const phoneNormalized = this.normalizePhone(input.phone);
    const user = await this.userRepository.findNonDeletedByPhoneNormalized(phoneNormalized);
    const now = new Date();

    if (!user || !this.userService.canAttemptLogin(user, now)) {
      throw this.createInvalidLoginError();
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      await this.recordFailedLogin(user, now);
      void this.auditService?.log({
        actorId: String(user._id),
        actorType: 'user',
        action: AuditAction.AUTH_LOGIN_FAILED,
        resourceType: 'auth',
        resourceId: String(user._id),
        ...(metadata.ip !== undefined ? { ip: metadata.ip } : {}),
        ...(metadata.userAgent !== undefined ? { userAgent: metadata.userAgent } : {}),
        ...(metadata.requestId !== undefined ? { requestId: metadata.requestId } : {}),
        severity: 'warning',
      });
      throw this.createInvalidLoginError();
    }

    await this.userRepository.updateLoginSuccessMetadata(user._id, metadata.ip, now);

    const refreshToken = this.refreshTokenService.issueRefreshToken(now);
    const accessTokenJti = this.accessTokenService.createJti();
    const sessionInput = {
      userId: user._id,
      refreshTokenHash: refreshToken.refreshTokenHash,
      accessTokenJti,
      expiresAt: refreshToken.expiresAt,
      ...definedLoginSessionMetadata(input, metadata),
    };
    const session = await this.sessionRepository.createSession(sessionInput);
    const issuedAccessToken = this.accessTokenService.issueAccessToken({
      sub: String(user._id),
      jti: accessTokenJti,
      sessionId: String(session._id),
    });

    void this.auditService?.log({
      actorId: String(user._id),
      actorType: 'user',
      action: AuditAction.AUTH_LOGIN_SUCCESS,
      resourceType: 'auth',
      resourceId: String(user._id),
      ...(metadata.ip !== undefined ? { ip: metadata.ip } : {}),
      ...(metadata.userAgent !== undefined ? { userAgent: metadata.userAgent } : {}),
      ...(metadata.requestId !== undefined ? { requestId: metadata.requestId } : {}),
      severity: 'info',
    });
    this.analyticsService?.track({
      type: 'user.logged_in',
      userId: String(user._id),
      ...(metadata.ip !== undefined ? { ip: metadata.ip } : {}),
      ...(metadata.userAgent !== undefined ? { userAgent: metadata.userAgent } : {}),
    });

    return createTokenResponse({
      accessToken: issuedAccessToken.accessToken,
      refreshToken: refreshToken.refreshToken,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      expiresIn: issuedAccessToken.expiresIn,
    });
  }

  async refresh(input: RefreshDto): Promise<TokenServiceResult> {
    const now = new Date();
    const currentRefreshTokenHash = hashToken(input.refreshToken);
    const session = await this.sessionRepository.findActiveByRefreshTokenHash(
      currentRefreshTokenHash,
      now,
    );

    if (!session) {
      throw this.createInvalidRefreshError();
    }

    const user = await this.userRepository.findById(session.userId);

    if (!user || !this.userService.canAttemptLogin(user, now)) {
      throw this.createInvalidRefreshError();
    }

    const nextRefreshToken = this.refreshTokenService.issueRefreshToken(now);
    const nextAccessTokenJti = this.accessTokenService.createJti();
    const rotatedSession = await this.sessionRepository.rotateRefreshTokenAtomically({
      sessionId: session._id,
      currentRefreshTokenHash,
      nextRefreshTokenHash: nextRefreshToken.refreshTokenHash,
      nextAccessTokenJti,
      now,
    });

    if (!rotatedSession) {
      throw this.createInvalidRefreshError();
    }

    const issuedAccessToken = this.accessTokenService.issueAccessToken({
      sub: String(user._id),
      jti: nextAccessTokenJti,
      sessionId: String(rotatedSession._id),
    });

    return createTokenResponse({
      accessToken: issuedAccessToken.accessToken,
      refreshToken: nextRefreshToken.refreshToken,
      refreshTokenExpiresAt: nextRefreshToken.expiresAt,
      expiresIn: issuedAccessToken.expiresIn,
    });
  }

  async forgotPassword(
    input: ForgotPasswordDto,
    metadata: RequestMetadata = {},
  ): Promise<AuthGenericResponseDto> {
    return this.getPasswordResetService().forgotPassword(input, metadata);
  }

  async verifyResetOtp(input: VerifyResetOtpDto): Promise<VerifyResetOtpResponseDto> {
    return this.getPasswordResetService().verifyResetOtp(input);
  }

  async resetPassword(input: ResetPasswordDto): Promise<AuthGenericResponseDto> {
    return this.getPasswordResetService().resetPassword(input);
  }

  async getCurrentAuthIdentity(authContext: AuthContext): Promise<MeResponseDto> {
    const user = await this.userRepository.findById(authContext.userId);

    if (!user || !this.userService.canAttemptLogin(user)) {
      throw this.createInvalidLogoutError();
    }

    return createMeResponse({
      id: String(user._id),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      phoneMasked: maskPhone(user.phoneNormalized),
    });
  }

  async listCurrentUserSessions(authContext: AuthContext): Promise<AuthSessionsResponseDto> {
    const sessions = await this.sessionRepository.findByUserId(authContext.userId);

    return createAuthSessionsResponse({
      sessions,
      currentSessionId: authContext.sessionId,
    });
  }

  async revokeCurrentUserSession(
    authContext: AuthContext,
    sessionId: string,
  ): Promise<AuthGenericResponseDto> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE);
    }

    const session = await this.sessionRepository.findByIdAndUserId(sessionId, authContext.userId);

    if (!session) {
      return createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE);
    }

    await this.sessionRepository.revokeSessionForUser(
      sessionId,
      authContext.userId,
      'user_revoked',
    );

    return createGenericAuthResponse(REVOKE_SESSION_GENERIC_MESSAGE);
  }

  async logout(authContext: AuthContext): Promise<AuthGenericResponseDto> {
    await this.revokeCurrentSession(authContext.sessionId, 'logout');
    void this.auditService?.log({
      actorId: authContext.userId,
      actorType: 'user',
      action: AuditAction.AUTH_LOGOUT,
      resourceType: 'auth',
      resourceId: authContext.userId,
      severity: 'info',
    });

    return createGenericAuthResponse(LOGOUT_GENERIC_MESSAGE);
  }

  async logoutAll(authContext: AuthContext): Promise<AuthGenericResponseDto> {
    await this.sessionRepository.revokeAllForUser(authContext.userId, 'logout_all');
    void this.auditService?.log({
      actorId: authContext.userId,
      actorType: 'user',
      action: AuditAction.AUTH_LOGOUT_ALL,
      resourceType: 'auth',
      resourceId: authContext.userId,
      severity: 'info',
    });

    return createGenericAuthResponse(LOGOUT_ALL_GENERIC_MESSAGE);
  }

  private getPasswordResetService(): PasswordResetService {
    if (!this.passwordResetService) {
      throw new Error('Password reset service is not configured.');
    }

    return this.passwordResetService;
  }

  private async recordFailedLogin(user: { _id: unknown; failedLoginCount: number }, now: Date) {
    const nextFailedLoginCount = user.failedLoginCount + 1;
    const lockedUntil =
      nextFailedLoginCount >= FAILED_LOGIN_LOCK_THRESHOLD
        ? new Date(now.getTime() + FAILED_LOGIN_LOCK_MS)
        : undefined;

    await this.userRepository.incrementFailedLogin(String(user._id), lockedUntil);
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

  private createInvalidPhoneVerificationError(): BadRequestException {
    return new BadRequestException(INVALID_PHONE_VERIFICATION_MESSAGE);
  }

  private createInvalidLoginError(): UnauthorizedException {
    return new UnauthorizedException(INVALID_LOGIN_MESSAGE);
  }

  private createInvalidRefreshError(): UnauthorizedException {
    return new UnauthorizedException(INVALID_REFRESH_MESSAGE);
  }

  private createInvalidLogoutError(): UnauthorizedException {
    return new UnauthorizedException(INVALID_LOGOUT_MESSAGE);
  }

  private async revokeCurrentSession(sessionId: string, revokedReason: 'logout'): Promise<void> {
    const session = await this.sessionRepository.findActiveById(sessionId);

    if (!session) {
      throw this.createInvalidLogoutError();
    }

    await this.sessionRepository.revokeSession(sessionId, revokedReason);
  }

  private async isOtpRequestAllowed(
    phoneNormalized: string,
    purpose: OtpPurpose,
    metadata: RequestMetadata,
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

  private async sendPhoneVerificationOtpIfAllowed(
    phoneNormalized: string,
    metadata: RegisterRequestMetadata,
  ): Promise<void> {
    const now = new Date();
    const otpRequestAllowed = await this.isOtpRequestAllowed(
      phoneNormalized,
      PHONE_VERIFICATION_PURPOSE,
      metadata,
      now,
    );

    if (!otpRequestAllowed) {
      void this.auditService?.log({
        actorType: 'system',
        action: AuditAction.OTP_RATE_LIMITED,
        resourceType: 'auth',
        severity: 'warning',
        metadata: {
          phoneMasked: maskPhone(phoneNormalized),
          purpose: PHONE_VERIFICATION_PURPOSE,
          ...definedMetadata(metadata),
        },
      });
      return;
    }

    const latestChallenge = await this.otpChallengeRepository.findLatestActiveByPhoneAndPurpose(
      phoneNormalized,
      PHONE_VERIFICATION_PURPOSE,
      now,
    );

    if (latestChallenge && !this.otpChallengeService.canResend(latestChallenge, now)) {
      return;
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    const expiresAt = new Date(now.getTime() + this.authConfig.otpTtlSeconds * 1000);
    const nextResendAt = this.otpChallengeService.calculateNextResendAt(
      this.authConfig.otpResendCooldownSeconds,
      now,
    );

    const challengeInput = {
      phoneNormalized,
      purpose: PHONE_VERIFICATION_PURPOSE,
      codeHash,
      expiresAt,
      maxAttempts: this.authConfig.otpMaxAttempts,
      nextResendAt,
      ...definedMetadata(metadata),
    };

    await this.otpChallengeRepository.createChallenge(challengeInput);
    void this.auditService?.log({
      actorType: 'system',
      action: AuditAction.OTP_CREATED,
      resourceType: 'auth',
      severity: 'info',
      metadata: {
        phoneMasked: maskPhone(phoneNormalized),
        purpose: PHONE_VERIFICATION_PURPOSE,
        ...definedMetadata(metadata),
      },
    });
    this.analyticsService?.track({
      type: 'otp.requested',
      ...(metadata.ip !== undefined ? { ip: metadata.ip } : {}),
      ...(metadata.userAgent !== undefined ? { userAgent: metadata.userAgent } : {}),
    });
    await this.smsService.enqueueSms({
      recipientPhoneNormalized: phoneNormalized,
      message: `Your Dragon verification code is ${code}.`,
      purpose: PHONE_VERIFICATION_PURPOSE,
      ...definedSmsMetadata(metadata),
    });
  }
}

function definedMetadata(metadata: RequestMetadata): {
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

function definedSmsMetadata(metadata: RequestMetadata): {
  requestId?: string;
} {
  const result: { requestId?: string } = {};

  if (metadata.requestId !== undefined) {
    result.requestId = metadata.requestId;
  }

  return result;
}

function definedLoginSessionMetadata(
  input: LoginDto,
  metadata: LoginRequestMetadata,
): {
  deviceId?: string;
  deviceName?: string;
  ip?: string;
  userAgent?: string;
} {
  const result: {
    deviceId?: string;
    deviceName?: string;
    ip?: string;
    userAgent?: string;
  } = {};

  if (input.deviceId !== undefined) {
    result.deviceId = input.deviceId;
  }

  if (input.deviceName !== undefined) {
    result.deviceName = input.deviceName;
  }

  if (metadata.ip !== undefined) {
    result.ip = metadata.ip;
  }

  if (metadata.userAgent !== undefined) {
    result.userAgent = metadata.userAgent;
  }

  return result;
}
