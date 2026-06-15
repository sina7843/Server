import { createHash } from 'node:crypto';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type {
  PublicSiteSettingsResponse,
  SubmitContactMessageResponse,
} from '@dragon/types';
import { SiteSettingsService } from '../site-settings.service';
import { ContactMessageService } from '../contact-message.service';
import { ContactRateLimitGuard } from '../contact-rate-limit.guard';
import { toPublicSiteSettingsResponse } from './dto/public-site-response';
import { isHoneypotTriggered, parseContactMessageBody } from './dto/contact-message-body';

const IP_SALT = process.env.CONTACT_IP_SALT ?? 'dragon-contact-salt';

@Controller('api/v1/site')
export class PublicSiteController {
  constructor(
    private readonly settingsService: SiteSettingsService,
    private readonly messageService: ContactMessageService,
  ) {}

  @Get('settings')
  async getSettings(): Promise<PublicSiteSettingsResponse> {
    const view = await this.settingsService.getSettings();
    return toPublicSiteSettingsResponse(view);
  }

  @Post('contact-messages')
  @UseGuards(ContactRateLimitGuard)
  async submitContactMessage(
    @Body() body: unknown,
    @Req() req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<SubmitContactMessageResponse> {
    if (isHoneypotTriggered(body)) {
      return { success: true };
    }
    const parsed = parseContactMessageBody(body);
    const ipHash = this.hashIp(req);
    await this.messageService.submit({ ...parsed, ipHash });
    return { success: true };
  }

  private hashIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
    const fwd = req.headers['x-forwarded-for'];
    const ip =
      (typeof fwd === 'string' && fwd.length > 0 ? fwd.split(',')[0]?.trim() : undefined) ??
      req.ip ??
      'unknown';
    return createHash('sha256').update(`${ip}${IP_SALT}`).digest('hex');
  }
}
