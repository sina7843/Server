export interface Phase1DevSeedResult {
  readonly usersCreated: number;
  readonly usersUpdated: number;
  readonly profilesCreated: number;
  readonly profilesUpdated: number;
  readonly userRolesAttached: number;
  readonly gamesCreated: number;
  readonly gamesUpdated: number;
  readonly tournamentsCreated: number;
  readonly tournamentsUpdated: number;
  readonly registrationsCreated: number;
  readonly registrationsUpdated: number;
  readonly matchesCreated: number;
  readonly matchesUpdated: number;
  readonly notificationLogsCreated: number;
  readonly notificationLogsUpdated: number;
  readonly skipped: readonly string[];
}

export interface Phase1DevSeedResetResult {
  readonly usersDeleted: number;
  readonly profilesDeleted: number;
  readonly userRolesDeleted: number;
  readonly gamesDeleted: number;
  readonly tournamentsDeleted: number;
  readonly registrationsDeleted: number;
  readonly matchesDeleted: number;
  readonly notificationLogsDeleted: number;
}


