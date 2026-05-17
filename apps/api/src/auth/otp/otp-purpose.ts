export const OTP_PURPOSES = [
  'phone_verification',
  'password_reset',
  'sensitive_action',
  'admin_step_up',
] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];
