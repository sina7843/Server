import { Injectable } from '@nestjs/common';
import { HtmlSanitizer } from '../content/rich-text/html-sanitizer';
import { SiteSettingsRepository } from './site-settings.repository';
import type { AboutInfo, ContactInfo, UpdateSiteSettingsInput } from './site-settings.types';

export interface SiteSettingsView {
  about: AboutInfo;
  contact: ContactInfo;
  updatedAt: Date | null;
}

const EMPTY_VIEW: SiteSettingsView = {
  about: { title: '', bodyJson: {}, bodyHtml: '' },
  contact: { socials: [] },
  updatedAt: null,
};

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly repository: SiteSettingsRepository,
    private readonly sanitizer: HtmlSanitizer,
  ) {}

  async getSettings(): Promise<SiteSettingsView> {
    const doc = await this.repository.findSingleton();
    if (!doc) return { ...EMPTY_VIEW };
    return {
      about: doc.about,
      contact: doc.contact,
      updatedAt: doc.updatedAt ?? null,
    };
  }

  async updateSettings(input: UpdateSiteSettingsInput, userId?: string): Promise<SiteSettingsView> {
    const sanitized: UpdateSiteSettingsInput = {
      about: {
        title: input.about.title,
        bodyJson: input.about.bodyJson,
        bodyHtml: this.sanitizer.sanitize(input.about.bodyHtml),
      },
      contact: input.contact,
      ...(userId ? { updatedBy: userId } : {}),
    };
    const doc = await this.repository.upsert(sanitized);
    return {
      about: doc!.about,
      contact: doc!.contact,
      updatedAt: doc!.updatedAt ?? null,
    };
  }
}
