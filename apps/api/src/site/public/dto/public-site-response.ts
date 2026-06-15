import type { PublicSiteSettingsResponse } from '@dragon/types';
import type { SiteSettingsView } from '../../site-settings.service';

export function toPublicSiteSettingsResponse(view: SiteSettingsView): PublicSiteSettingsResponse {
  return {
    settings: {
      about: { title: view.about.title, bodyHtml: view.about.bodyHtml },
      contact: {
        ...(view.contact.email ? { email: view.contact.email } : {}),
        ...(view.contact.phone ? { phone: view.contact.phone } : {}),
        ...(view.contact.address ? { address: view.contact.address } : {}),
        ...(view.contact.mapEmbedUrl ? { mapEmbedUrl: view.contact.mapEmbedUrl } : {}),
        socials: view.contact.socials.map((s) => ({ platform: s.platform, url: s.url })),
      },
    },
  };
}
