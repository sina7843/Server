import type { AdminMeResponse, AuthIdentity } from '@dragon/types';

export type AdminMeResponseDto = AdminMeResponse;

export function createAdminMeResponse(input: {
  readonly user: AuthIdentity;
  readonly permissions: readonly string[];
  readonly isSuperAdmin: boolean;
}): AdminMeResponseDto {
  return {
    user: input.user,
    permissions: [...input.permissions],
    isSuperAdmin: input.isSuperAdmin,
  };
}
