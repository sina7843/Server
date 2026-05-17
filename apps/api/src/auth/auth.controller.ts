import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, type RequestMetadata } from './auth.service';
import { type AuthGenericResponseDto } from './dto/auth-response.dto';
import { parseForgotPasswordDto } from './dto/forgot-password.dto';
import { parseLoginDto } from './dto/login.dto';
import { type MeResponseDto } from './dto/me-response.dto';
import { type AuthSessionsResponseDto } from './dto/session-response.dto';
import { parseLogoutDto } from './dto/logout.dto';
import { parseRefreshDto } from './dto/refresh.dto';
import { parseRegisterDto } from './dto/register.dto';
import { parseResetPasswordDto } from './dto/reset-password.dto';
import { parseVerifyResetOtpDto, type VerifyResetOtpResponseDto } from './dto/verify-reset-otp.dto';
import { type TokenResponseDto } from './dto/token-response.dto';
import { parseVerifyPhoneDto } from './dto/verify-phone.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentAuthContext } from './guards/current-auth-context.decorator';
import type { AuthContext } from './guards/authenticated-request';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: unknown,
    @Req() request: AuthMetadataRequest,
  ): Promise<AuthGenericResponseDto> {
    return this.authService.register(parseRegisterDto(body), extractRequestMetadata(request));
  }

  @Post('verify-phone')
  verifyPhone(@Body() body: unknown): Promise<AuthGenericResponseDto> {
    return this.authService.verifyPhone(parseVerifyPhoneDto(body));
  }

  @Post('login')
  login(@Body() body: unknown, @Req() request: AuthMetadataRequest): Promise<TokenResponseDto> {
    return this.authService.login(parseLoginDto(body), extractRequestMetadata(request));
  }

  @Post('refresh')
  refresh(@Body() body: unknown): Promise<TokenResponseDto> {
    return this.authService.refresh(parseRefreshDto(body));
  }

  @Post('password/forgot')
  forgotPassword(
    @Body() body: unknown,
    @Req() request: AuthMetadataRequest,
  ): Promise<AuthGenericResponseDto> {
    return this.authService.forgotPassword(
      parseForgotPasswordDto(body),
      extractRequestMetadata(request),
    );
  }

  @Post('password/verify-reset-otp')
  verifyResetOtp(@Body() body: unknown): Promise<VerifyResetOtpResponseDto> {
    return this.authService.verifyResetOtp(parseVerifyResetOtpDto(body));
  }

  @Post('password/reset')
  resetPassword(@Body() body: unknown): Promise<AuthGenericResponseDto> {
    return this.authService.resetPassword(parseResetPasswordDto(body));
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(
    @CurrentAuthContext() authContext: AuthContext,
    @Body() body: unknown,
  ): Promise<AuthGenericResponseDto> {
    parseLogoutDto(body);

    return this.authService.logout(authContext);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout-all')
  logoutAll(
    @CurrentAuthContext() authContext: AuthContext,
    @Body() body: unknown,
  ): Promise<AuthGenericResponseDto> {
    parseLogoutDto(body);

    return this.authService.logoutAll(authContext);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@CurrentAuthContext() authContext: AuthContext): Promise<MeResponseDto> {
    return this.authService.getCurrentAuthIdentity(authContext);
  }

  @UseGuards(AccessTokenGuard)
  @Get('sessions')
  sessions(@CurrentAuthContext() authContext: AuthContext): Promise<AuthSessionsResponseDto> {
    return this.authService.listCurrentUserSessions(authContext);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('sessions/:sessionId')
  revokeSession(
    @CurrentAuthContext() authContext: AuthContext,
    @Param('sessionId') sessionId: string,
  ): Promise<AuthGenericResponseDto> {
    return this.authService.revokeCurrentUserSession(authContext, sessionId);
  }
}

interface AuthMetadataRequest {
  readonly ip?: string;
  readonly headers?: Record<string, string | string[] | undefined>;
}

function extractRequestMetadata(request: AuthMetadataRequest): RequestMetadata {
  const metadata: { requestId?: string; ip?: string; userAgent?: string } = {};
  const requestId = readHeader(request, 'x-request-id');
  const userAgent = readHeader(request, 'user-agent');

  if (request.ip !== undefined && request.ip.length > 0) {
    metadata.ip = request.ip;
  }

  if (userAgent !== undefined && userAgent.length > 0) {
    metadata.userAgent = userAgent;
  }

  if (requestId !== undefined && requestId.length > 0) {
    metadata.requestId = requestId;
  }

  return metadata;
}

function readHeader(request: AuthMetadataRequest, headerName: string): string | undefined {
  const value = request.headers?.[headerName];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
