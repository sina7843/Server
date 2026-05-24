import { Controller, Get, Param } from '@nestjs/common';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import { AvatarService } from './avatar.service';
import { UserProfileService } from './profile.service';

@Controller('api/v1/u')
export class ProfileController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get(':username')
  async getPublicProfile(@Param('username') username: string): Promise<PublicProfileResponseDto> {
    const result = await this.profileService.getPublicProfileByUsername(username);

    if ('state' in result) return result;

    const avatarData = await this.avatarService.resolveAvatarUrls(result.avatarMediaId);

    return avatarData ? { ...result, ...avatarData } : result;
  }
}
