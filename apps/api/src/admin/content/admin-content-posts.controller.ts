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
import { AdminContentPostsService } from './admin-content-posts.service';
import { parseAdminContentListQuery } from './dto/admin-content-query';
import { parseAdminCreatePostBody, parseAdminUpdatePostBody } from './dto/admin-post-body';
import {
  toAdminPostListResponse,
  toAdminPostResponse,
  toRevisionDetail,
  toRevisionListResponse,
} from './dto/admin-post-response';
import type {
  AdminPostListResponse,
  AdminPostResponse,
  ContentRevisionListResponse,
  ContentRevisionResponse,
  ContentGenericResponse,
} from '@dragon/types';

@Controller('admin/v1/content/posts')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminContentPostsController {
  constructor(private readonly service: AdminContentPostsService) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_POST_READ)
  async listPosts(@Query() query: unknown): Promise<AdminPostListResponse> {
    const q = parseAdminContentListQuery(query);
    const { items, total } = await this.service.listPosts(q);
    return toAdminPostListResponse(items, total, q.page, q.limit);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_POST_CREATE)
  async createPost(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPostResponse> {
    const post = await this.service.createPost(parseAdminCreatePostBody(body), req.auth!.userId);
    return toAdminPostResponse(post);
  }

  @Get(':id')
  @RequirePermission(Permissions.CONTENT_POST_READ)
  async getPost(@Param('id') id: string): Promise<AdminPostResponse> {
    const post = await this.service.getPost(id);
    return toAdminPostResponse(post);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_POST_UPDATE)
  async updatePost(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPostResponse> {
    const post = await this.service.updatePost(
      id,
      parseAdminUpdatePostBody(body),
      req.auth!.userId,
    );
    return toAdminPostResponse(post);
  }

  @Post(':id/preview')
  @RequirePermission(Permissions.CONTENT_POST_READ)
  async previewPost(@Param('id') id: string): Promise<AdminPostResponse> {
    const post = await this.service.previewPost(id);
    return toAdminPostResponse(post);
  }

  @Post(':id/publish')
  @RequirePermission(Permissions.CONTENT_POST_PUBLISH)
  async publishPost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPostResponse> {
    const post = await this.service.publishPost(id, req.auth!.userId);
    return toAdminPostResponse(post);
  }

  @Post(':id/archive')
  @RequirePermission(Permissions.CONTENT_POST_ARCHIVE)
  async archivePost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminPostResponse> {
    const post = await this.service.archivePost(id, req.auth!.userId);
    return toAdminPostResponse(post);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_POST_UPDATE)
  async softDeletePost(@Param('id') id: string): Promise<ContentGenericResponse> {
    await this.service.softDeletePost(id);
    return { success: true, message: 'Post deleted.' };
  }

  @Get(':id/revisions')
  @RequirePermission(Permissions.CONTENT_POST_READ)
  async listPostRevisions(@Param('id') id: string): Promise<ContentRevisionListResponse> {
    const revisions = await this.service.listPostRevisions(id);
    return toRevisionListResponse(revisions);
  }

  @Get(':id/revisions/:revisionId')
  @RequirePermission(Permissions.CONTENT_POST_READ)
  async getPostRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ): Promise<ContentRevisionResponse> {
    const revision = await this.service.getPostRevision(id, revisionId);
    return { revision: toRevisionDetail(revision) };
  }
}
