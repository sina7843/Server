import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
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
  constructor(
    private readonly tagService: TagService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_TAG_READ)
  async listTags(): Promise<AdminTagListResponse> {
    const tags = await this.tagService.list(true);
    return toAdminTagListResponse(tags);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_TAG_CREATE)
  async createTag(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTagResponse> {
    const input = parseAdminCreateTagBody(body);
    const tag = await this.tagService.create({
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slug,
    });
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_TAG_CREATED,
      resourceType: 'content_tag',
      resourceId: String(tag._id),
      after: { name: tag.name, slug: tag.slug },
      severity: 'info',
    });
    return toAdminTagResponse(tag);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_TAG_UPDATE)
  async updateTag(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminTagResponse> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateTagBody(body);
    const updated = await this.tagService.update(id, input);
    if (!updated) {
      throw new NotFoundException('Tag not found.');
    }
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_TAG_UPDATED,
      resourceType: 'content_tag',
      resourceId: id,
      after: { name: updated.name, slug: updated.slug },
      severity: 'info',
    });
    return toAdminTagResponse(updated);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_TAG_DELETE)
  async deleteTag(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ContentGenericResponse> {
    const id = validateObjectId(rawId, 'id');
    await this.tagService.softDelete(id);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_TAG_DELETED,
      resourceType: 'content_tag',
      resourceId: id,
      severity: 'warning',
    });
    return { success: true, message: 'Tag deleted.' };
  }
}
