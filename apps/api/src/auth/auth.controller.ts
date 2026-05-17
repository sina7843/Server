import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type AuthGenericResponseDto } from './dto/auth-response.dto';
import { parseLoginDto } from './dto/login.dto';
import { parseLogoutDto } from './dto/logout.dto';
import { parseRefreshDto } from './dto/refresh.dto';
import { parseRegisterDto } from './dto/register.dto';
import { type TokenResponseDto } from './dto/token-response.dto';
import { parseVerifyPhoneDto } from './dto/verify-phone.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentAuthContext } from './guards/current-auth-context.decorator';
import type { AuthContext } from './guards/authenticated-request';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: unknown): Promise<AuthGenericResponseDto> {
    return this.authService.register(parseRegisterDto(body));
  }

  @Post('verify-phone')
  verifyPhone(@Body() body: unknown): Promise<AuthGenericResponseDto> {
    return this.authService.verifyPhone(parseVerifyPhoneDto(body));
  }

  @Post('login')
  login(@Body() body: unknown): Promise<TokenResponseDto> {
    return this.authService.login(parseLoginDto(body));
  }

  @Post('refresh')
  refresh(@Body() body: unknown): Promise<TokenResponseDto> {
    return this.authService.refresh(parseRefreshDto(body));
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
}
