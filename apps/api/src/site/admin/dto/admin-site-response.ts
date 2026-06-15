import type {
  AdminSiteSettingsResponse,
  ContactMessageDto,
  ContactMessageListResponse,
  ContactMessageResponse,
} from '@dragon/types';
import type { SiteSettingsView } from '../../site-settings.service';
import type { ContactMessageDocument } from '../../contact-message.schema';

export function toAdminSiteSettingsResponse(view: SiteSettingsView): AdminSiteSettingsResponse {
  return {
    settings: {
      about: {
        title: view.about.title,
        bodyJson: view.about.bodyJson,
        bodyHtml: view.about.bodyHtml,
      },
      contact: {
        ...(view.contact.email ? { email: view.contact.email } : {}),
        ...(view.contact.phone ? { phone: view.contact.phone } : {}),
        ...(view.contact.address ? { address: view.contact.address } : {}),
        ...(view.contact.mapEmbedUrl ? { mapEmbedUrl: view.contact.mapEmbedUrl } : {}),
        socials: view.contact.socials.map((s) => ({ platform: s.platform, url: s.url })),
      },
      updatedAt: (view.updatedAt ?? new Date(0)).toISOString(),
    },
  };
}

function toContactMessageDto(doc: ContactMessageDocument): ContactMessageDto {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    ...(doc.subject ? { subject: doc.subject } : {}),
    message: doc.message,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toContactMessageResponse(doc: ContactMessageDocument): ContactMessageResponse {
  return { message: toContactMessageDto(doc) };
}

export function toContactMessageListResponse(
  items: ContactMessageDocument[],
  total: number,
  page: number,
  limit: number,
): ContactMessageListResponse {
  return { items: items.map(toContactMessageDto), total, page, limit };
}
