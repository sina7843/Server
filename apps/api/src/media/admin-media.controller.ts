import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permissions } from '../rbac/registry/permission-keys';
import type { AuthenticatedRequest } from '../auth/guards/authenticated-request';
import { AdminMediaService } from './admin-media.service';
import { getMaxFileSizeBytes } from './media-upload.config';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
} from '@dragon/types';

@Controller('admin/v1/media')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminMediaController {
  constructor(private readonly service: AdminMediaService) {}

  @Get()
  @RequirePermission(Permissions.MEDIA_ASSET_READ)
  listMedia(@Query() query: unknown): Promise<AdminMediaListResponseDto> {
    return this.service.listMedia(query);
  }

  @Post('upload')
  @RequirePermission(Permissions.MEDIA_ASSET_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: getMaxFileSizeBytes() },
    }),
  )
  uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminMediaUploadResponseDto> {
    return this.service.uploadMedia(file, body, req.auth!.userId);
  }

  @Get(':id')
  @RequirePermission(Permissions.MEDIA_ASSET_READ)
  getMedia(@Param('id') id: string): Promise<AdminMediaAssetDto> {
    return this.service.getMedia(id);
  }

  @Patch(':id')
  @RequirePermission(Permissions.MEDIA_ASSET_UPDATE)
  updateMedia(@Param('id') id: string, @Body() body: unknown): Promise<AdminMediaAssetDto> {
    return this.service.updateMedia(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission(Permissions.MEDIA_ASSET_DELETE)
  async deleteMedia(@Param('id') id: string): Promise<void> {
    await this.service.deleteMedia(id);
  }
}
