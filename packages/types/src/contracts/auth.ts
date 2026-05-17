export type UserStatus =
  | "pending_verification"
  | "active"
  | "suspended"
  | "banned"
  | "deleted";

export type SessionRevocationReason =
  | "logout"
  | "logout_all"
  | "password_reset"
  | "admin_revoked"
  | "expired"
  | "security";

export type OtpPurpose =
  | "phone_verification"
  | "password_reset"
  | "sensitive_action"
  | "admin_step_up";
