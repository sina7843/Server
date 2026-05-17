import type { AuthGenericResponse } from '@dragon/types';

export const REGISTER_GENERIC_MESSAGE =
  'If the phone can be registered, a verification code will be sent.';

export const VERIFY_PHONE_GENERIC_MESSAGE = 'Phone verification completed if the code was valid.';

export const LOGOUT_GENERIC_MESSAGE = 'Logged out successfully.';

export const LOGOUT_ALL_GENERIC_MESSAGE = 'All sessions were logged out successfully.';

export const REVOKE_SESSION_GENERIC_MESSAGE = 'Session revoked successfully.';

export const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'If the phone is eligible, a password reset code will be sent.';

export const RESET_PASSWORD_GENERIC_MESSAGE = 'Password reset completed.';

export class AuthGenericResponseDto implements AuthGenericResponse {
  readonly success = true;

  constructor(readonly message = REGISTER_GENERIC_MESSAGE) {}
}

export function createGenericAuthResponse(
  message = REGISTER_GENERIC_MESSAGE,
): AuthGenericResponseDto {
  return new AuthGenericResponseDto(message);
}
