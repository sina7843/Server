import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MyUserProfileDto } from '@dragon/types';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthContext } from '../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../auth/guards/current-auth-context.decorator';
import { AvatarService } from './avatar.service';
import { toMyUserProfileDto } from './profile.mapper';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

function parseSetAvatarBody(body: unknown): string {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Request body is required.');
  }

  const { mediaAssetId } = body as Record<string, unknown>;

  if (typeof mediaAssetId !== 'string' || !mediaAssetId.trim()) {
    throw new BadRequestException('mediaAssetId is required and must be a non-empty string.');
  }

  return mediaAssetId.trim();
}

@Controller('api/v1/me/avatar')
@UseGuards(AccessTokenGuard)
export class MeAvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post()
  async setAvatar(
    @CurrentAuthContext() authContext: AuthContext,
    @Body() body: Record<string, unknown>,
  ): Promise<MyUserProfileDto> {
    const mediaAssetId = parseSetAvatarBody(body);
    const profile = await this.avatarService.setAvatar(authContext.userId, mediaAssetId);
    const avatarData = await this.avatarService.resolveAvatarUrls(
      profile.avatarMediaId ? String(profile.avatarMediaId) : undefined,
    );
    return toMyUserProfileDto(profile, avatarData);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR_MAX_BYTES } }))
  async uploadAvatar(
    @CurrentAuthContext() authContext: AuthContext,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MyUserProfileDto> {
    if (!file) throw new BadRequestException('No file was uploaded.');

    const profile = await this.avatarService.uploadAndSetAvatar(authContext.userId, file);
    const avatarData = await this.avatarService.resolveAvatarUrls(
      profile.avatarMediaId ? String(profile.avatarMediaId) : undefined,
    );
    return toMyUserProfileDto(profile, avatarData);
  }

  @Delete()
  async deleteAvatar(@CurrentAuthContext() authContext: AuthContext): Promise<MyUserProfileDto> {
    const profile = await this.avatarService.deleteAvatar(authContext.userId);
    return toMyUserProfileDto(profile);
  }
}
