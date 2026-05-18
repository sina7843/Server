export type ProfileVisibility = 'public' | 'private';

export interface ProfileIdentityContract {
  readonly username: string;
  readonly displayName: string;
  readonly avatarMediaId?: string;
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
  readonly publicUrl: string;
}

export interface PublicUserProfileDto {
  readonly username: string;
  readonly displayName: string;
  readonly avatarMediaId?: string;
  readonly bio?: string;
  readonly visibility: 'public';
  readonly publicUrl: string;
}

export interface PrivateProfileStateDto {
  readonly state: 'private';
}

export interface ProfileNotFoundStateDto {
  readonly state: 'not_found';
}

export interface ProfileErrorStateDto {
  readonly state: 'error';
  readonly message?: string;
}

export type PublicProfileResponseDto =
  | PublicUserProfileDto
  | PrivateProfileStateDto
  | ProfileNotFoundStateDto;

export interface MyUserProfileDto {
  readonly username: string;
  readonly displayName: string;
  readonly avatarMediaId?: string;
  readonly bio?: string;
  readonly visibility: ProfileVisibility;
  readonly publicUrl: string;
}

export interface UpdateMyProfileDto {
  readonly username?: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly visibility?: ProfileVisibility;
  readonly avatarMediaId?: string | null;
}
