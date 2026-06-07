// Shared tournament-domain constants used by both the service layer and the repository.
// Centralizing here prevents the raw 'registration_open' string from drifting independently
// between the service contradiction guard and the repository query construction.

export const REGISTRATION_OPEN_STATUS = 'registration_open' as const;
