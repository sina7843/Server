export const PHASE1_DEV_SEED_SOURCE = 'phase1-dev-seed';
export const PHASE1_DEV_SEED_BATCH = 'phase1-dev-seed-v1';
export const DEFAULT_DEV_SEED_PASSWORD = 'DragonTest@12345';
export const PHASE1_DEV_SEED_PASSWORD = DEFAULT_DEV_SEED_PASSWORD;

export const DEV_TEST_ACCOUNTS = [
  {
    purpose: 'Super Admin / Platform Owner',
    email: 'superadmin@dragon.local',
    phone: '+989001000001',
    username: 'superadmin',
    displayName: 'Dragon Super Admin',
    roles: ['super_admin'],
    status: 'active',
  },
  {
    purpose: 'Admin / Operations Manager',
    email: 'admin@dragon.local',
    phone: '+989001000002',
    username: 'admin',
    displayName: 'Dragon Operations Admin',
    roles: ['admin'],
    status: 'active',
  },
  {
    purpose: 'Tournament Manager / Organizer',
    email: 'organizer@dragon.local',
    phone: '+989001000003',
    username: 'organizer',
    displayName: 'Dragon Tournament Organizer',
    roles: ['tournament_manager'],
    status: 'active',
  },
  {
    purpose: 'Content Manager / Editor',
    email: 'editor@dragon.local',
    phone: '+989001000004',
    username: 'editor',
    displayName: 'Dragon Content Editor',
    roles: ['content_manager'],
    status: 'active',
  },
  {
    purpose: 'Player 1',
    email: 'player1@dragon.local',
    phone: '+989001000101',
    username: 'player1',
    displayName: 'Raha Phoenix',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Player 2',
    email: 'player2@dragon.local',
    phone: '+989001000102',
    username: 'player2',
    displayName: 'Arman Nova',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Player 3',
    email: 'player3@dragon.local',
    phone: '+989001000103',
    username: 'player3',
    displayName: 'Nika Storm',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Player 4',
    email: 'player4@dragon.local',
    phone: '+989001000104',
    username: 'player4',
    displayName: 'Kian Blaze',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Player 5',
    email: 'player5@dragon.local',
    phone: '+989001000105',
    username: 'player5',
    displayName: 'Mina Vector',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Player 6',
    email: 'player6@dragon.local',
    phone: '+989001000106',
    username: 'player6',
    displayName: 'Sina Quantum',
    roles: ['user'],
    status: 'active',
  },
  {
    purpose: 'Disabled / Suspended Sample User',
    email: 'disabled@dragon.local',
    phone: '+989001000199',
    username: 'disabled-user',
    displayName: 'Disabled Local User',
    roles: ['user'],
    status: 'suspended',
  },
] as const;

export const DEV_SEED_GAME_SLUGS = [
  'valorant',
  'ea-fc',
  'dota-2',
  'counter-strike-2',
  'league-of-legends',
  'mobile-legends',
] as const;

export const DEV_SEED_TOURNAMENT_SLUGS = [
  'valorant-open-registration-local',
  'valorant-full-capacity-local',
  'dota-round-robin-live-local',
  'cs2-manual-showcase-local',
  'league-completed-finals-local',
  'mobile-cancelled-cup-local',
  'ea-fc-draft-admin-local',
  'valorant-upcoming-registration-local',
  'cs2-registration-closed-local',
  'league-archived-season-local',
] as const;

export const DEV_SEED_CONTENT_CATEGORY_SLUGS = [
  'phase1-esports',
  'phase1-tournaments',
  'phase1-guides',
  'esports-news-fa',
  'analysis-fa',
  'player-guides-fa',
  'official-fa',
] as const;

export const DEV_SEED_CONTENT_TAG_SLUGS = [
  'phase1-featured',
  'phase1-local-test',
  'phase1-bracket',
  'featured',
  'valorant-fa',
  'dota2-fa',
  'cs2-fa',
  'tournament-fa',
] as const;

export const DEV_SEED_POST_SLUGS = [
  'phase1-local-valorant-open',
  'phase1-local-bracket-guide',
  'phase1-local-admin-announcement',
  'fa-valorant-season2-launch',
  'fa-esports-growth-analysis',
  'fa-tournament-registration-guide',
  'fa-season-1404-announcement',
  'fa-dragon-platform-launch',
  'fa-cs2-update-news',
  'fa-dota2-patch-notes',
  'fa-mobile-cup-recap',
  'fa-lol-new-season',
  'fa-eafc-cup-news',
  'fa-meta-analysis-valorant',
  'fa-team-strategy-guide',
  'fa-valorant-beginner-guide',
  'fa-bracket-system-guide',
  'fa-official-tournament-rules',
] as const;

export const DEV_SEED_PAGE_SLUGS = ['phase1-local-about', 'phase1-local-rules'] as const;

export const DEV_SEED_NOTIFICATION_TEMPLATE_KEYS = [
  'tournament.registration_submitted.local',
  'tournament.registration_approved.local',
  'tournament.registration_rejected.local',
  'tournament.cancelled.local',
] as const;

export const DEV_SEED_REQUEST_ID_PREFIX = 'phase1-dev-seed:';
