import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { AdminContentPagesService } from './admin-content-pages.service';
import { parseAdminPageListQuery } from './dto/admin-content-query';
import { parseAdminCreatePageBody, parseAdminUpdatePageBody } from './dto/admin-page-body';
import { toAdminPageListResponse, toAdminPageResponse } from './dto/admin-page-response';
import { toRevisionDetail, toRevisionListResponse } from './dto/admin-post-response';
import type {
  AdminPageListResponse,
  AdminPageResponse,
  ContentRevisionListResponse,
  ContentRevisionResponse,
  ContentGenericResponse,
} from '@dragon/types';

@Controller('admin/v1/content/pages')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminContentPagesController {
  constructor(private readonly service: AdminContentPagesService) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_PAGE_READ)
  async listPages(@Query() query: unknown): Promise<AdminPageListResponse> {
    const q = parseAdminPageListQuery(query);
    const { items, total } = await this.service.listPages(q);
    return toAdminPageListResponse(items, total, q.page, q.limit);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_PAGE_CREATE)
  async createPage(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPageResponse> {
    const page = await this.service.createPage(parseAdminCreatePageBody(body), req.auth!.userId);
    return toAdminPageResponse(page);
  }

  @Get(':id')
  @RequirePermission(Permissions.CONTENT_PAGE_READ)
  async getPage(@Param('id') id: string): Promise<AdminPageResponse> {
    const page = await this.service.getPage(id);
    return toAdminPageResponse(page);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_PAGE_UPDATE)
  async updatePage(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPageResponse> {
    const page = await this.service.updatePage(
      id,
      parseAdminUpdatePageBody(body),
      req.auth!.userId,
    );
    return toAdminPageResponse(page);
  }

  @Post(':id/preview')
  @RequirePermission(Permissions.CONTENT_PAGE_READ)
  async previewPage(@Param('id') id: string): Promise<AdminPageResponse> {
    const page = await this.service.previewPage(id);
    return toAdminPageResponse(page);
  }

  @Post(':id/publish')
  @RequirePermission(Permissions.CONTENT_PAGE_PUBLISH)
  async publishPage(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPageResponse> {
    const page = await this.service.publishPage(id, req.auth!.userId);
    return toAdminPageResponse(page);
  }

  @Post(':id/archive')
  @RequirePermission(Permissions.CONTENT_PAGE_ARCHIVE)
  async archivePage(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPageResponse> {
    const page = await this.service.archivePage(id, req.auth!.userId);
    return toAdminPageResponse(page);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_PAGE_UPDATE)
  async softDeletePage(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ContentGenericResponse> {
    await this.service.softDeletePage(id, req.auth?.userId);
    return { success: true, message: 'Page deleted.' };
  }

  @Get(':id/revisions')
  @RequirePermission(Permissions.CONTENT_PAGE_READ)
  async listPageRevisions(@Param('id') id: string): Promise<ContentRevisionListResponse> {
    const revisions = await this.service.listPageRevisions(id);
    return toRevisionListResponse(revisions);
  }

  @Get(':id/revisions/:revisionId')
  @RequirePermission(Permissions.CONTENT_PAGE_READ)
  async getPageRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ): Promise<ContentRevisionResponse> {
    const revision = await this.service.getPageRevision(id, revisionId);
    return { revision: toRevisionDetail(revision) };
  }
}
