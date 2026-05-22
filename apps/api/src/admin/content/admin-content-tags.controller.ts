import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { TagService } from '../../content/tags/tag.service';
import { parseAdminCreateTagBody, parseAdminUpdateTagBody } from './dto/admin-tag-body';
import { toAdminTagListResponse, toAdminTagResponse } from './dto/admin-tag-response';
import type { AdminTagListResponse, AdminTagResponse, ContentGenericResponse } from '@dragon/types';

@Controller('admin/v1/content/tags')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminContentTagsController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_TAG_READ)
  async listTags(): Promise<AdminTagListResponse> {
    const tags = await this.tagService.list(true);
    return toAdminTagListResponse(tags);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_TAG_CREATE)
  async createTag(@Body() body: unknown): Promise<AdminTagResponse> {
    const input = parseAdminCreateTagBody(body);
    const tag = await this.tagService.create({
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slug,
    });
    return toAdminTagResponse(tag);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_TAG_UPDATE)
  async updateTag(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminTagResponse> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateTagBody(body);
    const updated = await this.tagService.update(id, input);
    if (!updated) {
      throw new NotFoundException('Tag not found.');
    }
    return toAdminTagResponse(updated);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_TAG_DELETE)
  async deleteTag(@Param('id') rawId: string): Promise<ContentGenericResponse> {
    const id = validateObjectId(rawId, 'id');
    await this.tagService.softDelete(id);
    return { success: true, message: 'Tag deleted.' };
  }
}
