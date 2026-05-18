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

export type PublicProfileResponseDto =
  | PublicUserProfileDto
  | PrivateProfileStateDto
  | ProfileNotFoundStateDto;
