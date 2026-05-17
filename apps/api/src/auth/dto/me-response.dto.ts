import type { AuthIdentity, MeResponse } from '@dragon/types';

export type AuthIdentityDto = AuthIdentity;
export type MeResponseDto = MeResponse;

export function createMeResponse(input: {
  readonly id: string;
  readonly phoneVerified: boolean;
  readonly phoneMasked?: string;
}): MeResponseDto {
  return {
    user:
      input.phoneMasked === undefined
        ? {
            id: input.id,
            phoneVerified: input.phoneVerified,
            status: 'active',
          }
        : {
            id: input.id,
            phoneVerified: input.phoneVerified,
            status: 'active',
            phoneMasked: input.phoneMasked,
          },
  };
}
