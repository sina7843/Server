import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { SearchResultResponseDto, AdminReindexResponseDto, SearchScope } from '@dragon/types';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permissions } from '../rbac/registry/permission-keys';
import { QueueNames, JobNames } from '../jobs/queue-registry';
import { JobLogService } from '../jobs/job-log.service';
import { SearchService } from './search.service';
import { parseAdminSearchQuery } from './dto/admin-search-query';
import { toSearchResultResponse } from './dto/search-response';

const SEARCH_SCOPES: readonly string[] = ['content', 'users', 'media'];

@Controller('admin/v1/search')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly jobLogService: JobLogService,
  ) {}

  @Get('users')
  @RequirePermission(Permissions.SEARCH_USER_READ)
  async searchUsers(@Query() query: unknown): Promise<SearchResultResponseDto> {
    const parsed = parseAdminSearchQuery(query);
    const result = await this.searchService.searchAdminUsers(parsed);
    return toSearchResultResponse(result);
  }

  @Get('content')
  @RequirePermission(Permissions.SEARCH_CONTENT_READ)
  async searchContent(@Query() query: unknown): Promise<SearchResultResponseDto> {
    const parsed = parseAdminSearchQuery(query);
    const result = await this.searchService.searchAdminContent(parsed);
    return toSearchResultResponse(result);
  }

  @Get('media')
  @RequirePermission(Permissions.SEARCH_MEDIA_READ)
  async searchMedia(@Query() query: unknown): Promise<SearchResultResponseDto> {
    const parsed = parseAdminSearchQuery(query);
    const result = await this.searchService.searchAdminMedia(parsed);
    return toSearchResultResponse(result);
  }

  @Post('reindex')
  @RequirePermission(Permissions.SEARCH_REINDEX)
  async reindex(@Body() body: unknown): Promise<AdminReindexResponseDto> {
    const b = body as Record<string, unknown>;

    if (b?.scope !== undefined) {
      if (!(typeof b.scope === 'string' && SEARCH_SCOPES.includes(b.scope))) {
        throw new BadRequestException(`scope must be one of: ${SEARCH_SCOPES.join(', ')}.`);
      }
    }

    const scope = b?.scope !== undefined ? (b.scope as SearchScope) : undefined;

    await this.jobLogService.enqueue({
      queueName: QueueNames.SEARCH,
      jobName: JobNames.SEARCH_REINDEX_ALL,
      payload: scope !== undefined ? { scope } : {},
      maxAttempts: 1,
    });

    return {
      queued: true,
      message:
        'Reindex job queued. Phase 0 MongoSearchAdapter reads from source collections in real-time — no external index is maintained.',
      ...(scope !== undefined ? { scope } : {}),
    };
  }
}
