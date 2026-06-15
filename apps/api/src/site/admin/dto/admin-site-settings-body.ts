import { BadRequestException } from '@nestjs/common';
import type { UpdateSiteSettingsInput } from '../../site-settings.types';

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function optStr(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BadRequestException('Expected a string field.');
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseUpdateSiteSettingsBody(body: unknown): UpdateSiteSettingsInput {
  const root = asObject(body, 'request body');
  const about = asObject(root.about, 'about');
  const contact = asObject(root.contact, 'contact');

  const title = typeof about.title === 'string' ? about.title.trim() : '';
  const bodyHtml = typeof about.bodyHtml === 'string' ? about.bodyHtml : '';
  const bodyJson =
    typeof about.bodyJson === 'object' && about.bodyJson !== null
      ? (about.bodyJson as Record<string, unknown>)
      : {};

  const rawSocials = Array.isArray(contact.socials) ? contact.socials : [];
  const socials = rawSocials.map((entry) => {
    const s = asObject(entry, 'social link');
    const platform = typeof s.platform === 'string' ? s.platform.trim() : '';
    const url = typeof s.url === 'string' ? s.url.trim() : '';
    if (!platform || !url) throw new BadRequestException('Each social link needs platform + url.');
    return { platform, url };
  });

  const email = optStr(contact.email);
  const phone = optStr(contact.phone);
  const address = optStr(contact.address);
  const mapEmbedUrl = optStr(contact.mapEmbedUrl);

  return {
    about: { title, bodyJson, bodyHtml },
    contact: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(mapEmbedUrl ? { mapEmbedUrl } : {}),
      socials,
    },
  };
}
