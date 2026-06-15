// ─── Shared contact value objects ──────────────────────────────────────────
export interface SocialLinkDto {
  readonly platform: string;
  readonly url: string;
}

export interface ContactInfoDto {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly mapEmbedUrl?: string;
  readonly socials: readonly SocialLinkDto[];
}

export interface AboutInfoDto {
  readonly title: string;
  readonly bodyHtml: string;
}

// ─── Public responses ────────────────────────────────────────────────────────
export interface PublicSiteSettingsDto {
  readonly about: AboutInfoDto;
  readonly contact: ContactInfoDto;
}

export interface PublicSiteSettingsResponse {
  readonly settings: PublicSiteSettingsDto;
}

export interface SubmitContactMessageRequest {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  /** Honeypot — must be empty/omitted. */
  readonly website?: string;
}

export interface SubmitContactMessageResponse {
  readonly success: true;
}

// ─── Admin responses ─────────────────────────────────────────────────────────
export interface AdminAboutInfoDto extends AboutInfoDto {
  readonly bodyJson: Record<string, unknown>;
}

export interface AdminSiteSettingsDto {
  readonly about: AdminAboutInfoDto;
  readonly contact: ContactInfoDto;
  readonly updatedAt: string;
}

export interface AdminSiteSettingsResponse {
  readonly settings: AdminSiteSettingsDto;
}

export interface UpdateSiteSettingsRequest {
  readonly about: AdminAboutInfoDto;
  readonly contact: ContactInfoDto;
}

export interface ContactMessageDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface ContactMessageListResponse {
  readonly items: readonly ContactMessageDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ContactMessageResponse {
  readonly message: ContactMessageDto;
}

export interface SiteGenericResponse {
  readonly success: true;
  readonly message: string;
}
