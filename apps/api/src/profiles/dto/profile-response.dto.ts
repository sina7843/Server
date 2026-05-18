export interface PrivateProfileStateResponseDto {
  readonly state: 'private';
}

export interface ProfileNotFoundStateResponseDto {
  readonly state: 'not_found';
}

export function createPrivateProfileState(): PrivateProfileStateResponseDto {
  return { state: 'private' };
}

export function createProfileNotFoundState(): ProfileNotFoundStateResponseDto {
  return { state: 'not_found' };
}
