import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type {
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
  ContactMessageResponse,
  SiteGenericResponse,
} from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { SiteSettingsService } from '../site-settings.service';
import { ContactMessageService } from '../contact-message.service';
import { parseUpdateSiteSettingsBody } from './dto/admin-site-settings-body';
import {
  toAdminSiteSettingsResponse,
  toContactMessageListResponse,
  toContactMessageResponse,
} from './dto/admin-site-response';

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

@Controller('admin/v1/site')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSiteController {
  constructor(
    private readonly settingsService: SiteSettingsService,
    private readonly messageService: ContactMessageService,
  ) {}

  @Get('settings')
  @RequirePermission(Permissions.SITE_SETTINGS_READ)
  async getSettings(): Promise<AdminSiteSettingsResponse> {
    const view = await this.settingsService.getSettings();
    return toAdminSiteSettingsResponse(view);
  }

  @Put('settings')
  @RequirePermission(Permissions.SITE_SETTINGS_UPDATE)
  async updateSettings(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminSiteSettingsResponse> {
    const input = parseUpdateSiteSettingsBody(body);
    const view = await this.settingsService.updateSettings(input, req.auth?.userId);
    return toAdminSiteSettingsResponse(view);
  }

  @Get('contact-messages')
  @RequirePermission(Permissions.SITE_MESSAGE_READ)
  async listMessages(@Query() query: Record<string, unknown>): Promise<ContactMessageListResponse> {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, 20), 100);
    const { items, total } = await this.messageService.list(page, limit);
    return toContactMessageListResponse(items, total, page, limit);
  }

  @Get('contact-messages/:id')
  @RequirePermission(Permissions.SITE_MESSAGE_READ)
  async getMessage(@Param('id') id: string): Promise<ContactMessageResponse> {
    const doc = await this.messageService.getById(id);
    return toContactMessageResponse(doc);
  }

  @Delete('contact-messages/:id')
  @RequirePermission(Permissions.SITE_MESSAGE_MANAGE)
  async deleteMessage(@Param('id') id: string): Promise<SiteGenericResponse> {
    await this.messageService.delete(id);
    return { success: true, message: 'Contact message deleted.' };
  }
}
