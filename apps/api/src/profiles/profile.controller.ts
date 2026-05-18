import { Controller, Get, Param } from '@nestjs/common';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import { UserProfileService } from './profile.service';

@Controller('api/v1/u')
export class ProfileController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get(':username')
  getPublicProfile(@Param('username') username: string): Promise<PublicProfileResponseDto> {
    return this.profileService.getPublicProfileByUsername(username);
  }
}
