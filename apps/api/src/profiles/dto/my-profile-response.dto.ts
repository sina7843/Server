import type { ProfileVisibility } from '../profile.types';

export interface MyUserProfileDto {
  readonly username: string;
  readonly displayName: string;
  readonly avatarMediaId?: string;
  readonly avatarUrl?: string;
  readonly avatarVariants?: { readonly thumbnail?: string; readonly medium?: string };
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
  readonly publicUrl: string;
}
