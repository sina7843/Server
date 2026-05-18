import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { MyUserProfileDto } from '@dragon/types';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthContext } from '../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../auth/guards/current-auth-context.decorator';
import { validateUpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserProfileLifecycleService } from './profile-lifecycle.service';
import { UserProfileService } from './profile.service';

@Controller('api/v1/me/profile')
@UseGuards(AccessTokenGuard)
export class MeProfileController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly profileLifecycleService: UserProfileLifecycleService,
  ) {}

  @Get()
  async getMyProfile(@CurrentAuthContext() authContext: AuthContext): Promise<MyUserProfileDto> {
    await this.profileLifecycleService.ensureProfileForVerifiedUser(authContext.userId);

    return this.profileService.getMyProfile(authContext.userId);
  }

  @Patch()
  updateMyProfile(
    @CurrentAuthContext() authContext: AuthContext,
    @Body() body: Record<string, unknown>,
  ): Promise<MyUserProfileDto> {
    return this.profileService.updateMyProfile(
      authContext.userId,
      validateUpdateMyProfileDto(body),
    );
  }
}
