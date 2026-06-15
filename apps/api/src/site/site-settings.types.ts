export interface SocialLink {
  platform: string;
  url: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  mapEmbedUrl?: string;
  socials: SocialLink[];
}

export interface AboutInfo {
  title: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string;
}

export interface UpdateSiteSettingsInput {
  readonly about: AboutInfo;
  readonly contact: ContactInfo;
  readonly updatedBy?: string;
}
