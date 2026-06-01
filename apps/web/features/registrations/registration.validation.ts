import type { RegistrationFormData, RegistrationValidationResult } from './registration.types';

export const TEAM_NAME_MAX_LENGTH = 80;
export const TEAM_MEMBERS_MAX = 20;

export function validateRegistrationForm(data: RegistrationFormData): RegistrationValidationResult {
  const errors: Record<string, string> = {};

  if (data.type === 'team') {
    const name = data.teamName?.trim() ?? '';
    if (!name) {
      errors.teamName = 'Team name is required.';
    } else if (name.length > TEAM_NAME_MAX_LENGTH) {
      errors.teamName = `Team name must be at most ${TEAM_NAME_MAX_LENGTH} characters.`;
    }

    const members = data.members ?? [];
    if (members.length > TEAM_MEMBERS_MAX) {
      errors.members = `Team may have at most ${TEAM_MEMBERS_MAX} members.`;
    } else if (members.some((m) => !m.displayName?.trim())) {
      errors.members = 'Each team member must have a display name.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
