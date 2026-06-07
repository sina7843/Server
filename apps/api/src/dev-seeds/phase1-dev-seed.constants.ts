export const PHASE1_DEV_SEED_SOURCE = 'phase1-dev-seed';
export const PHASE1_DEV_SEED_BATCH = 'phase1-dev-seed-v1';
export const PHASE1_DEV_SEED_PASSWORD = 'DragonTest@12345';

export const PHASE1_DEV_SEED_ACCOUNTS = [
  {
    key: 'superadmin',
    label: 'Super Admin / Platform Owner',
    roleKey: 'super_admin',
    email: 'superadmin@dragon.local',
    phone: '+15550001001',
    username: 'dragon-superadmin',
    displayName: 'Dragon Super Admin',
  },
  {
    key: 'admin',
    label: 'Admin / Operations Manager',
    roleKey: 'admin',
    email: 'admin@dragon.local',
    phone: '+15550001002',
    username: 'dragon-admin',
    displayName: 'Dragon Admin',
  },
  {
    key: 'organizer',
    label: 'Tournament Manager / Organizer',
    roleKey: 'tournament_manager',
    email: 'organizer@dragon.local',
    phone: '+15550001003',
    username: 'dragon-organizer',
    displayName: 'Dragon Organizer',
  },
  {
    key: 'editor',
    label: 'Content Manager / Editor',
    roleKey: 'content_manager',
    email: 'editor@dragon.local',
    phone: '+15550001004',
    username: 'dragon-editor',
    displayName: 'Dragon Editor',
  },
  {
    key: 'player1',
    label: 'Player 1',
    roleKey: 'user',
    email: 'player1@dragon.local',
    phone: '+15550001011',
    username: 'dragon-player-1',
    displayName: 'Dragon Player 1',
  },
  {
    key: 'player2',
    label: 'Player 2',
    roleKey: 'user',
    email: 'player2@dragon.local',
    phone: '+15550001012',
    username: 'dragon-player-2',
    displayName: 'Dragon Player 2',
  },
  {
    key: 'player3',
    label: 'Player 3',
    roleKey: 'user',
    email: 'player3@dragon.local',
    phone: '+15550001013',
    username: 'dragon-player-3',
    displayName: 'Dragon Player 3',
  },
  {
    key: 'player4',
    label: 'Player 4',
    roleKey: 'user',
    email: 'player4@dragon.local',
    phone: '+15550001014',
    username: 'dragon-player-4',
    displayName: 'Dragon Player 4',
  },
] as const;

export const PHASE1_DEV_SEED_GAMES = [
  {
    key: 'valorant',
    name: 'Valorant',
    slug: 'phase1-dev-valorant',
    description: 'Local seed tactical FPS title for tournament flows.',
  },
  {
    key: 'ea-fc',
    name: 'EA FC',
    slug: 'phase1-dev-ea-fc',
    description: 'Local seed football esports title for tournament flows.',
  },
  {
    key: 'dota-2',
    name: 'Dota 2',
    slug: 'phase1-dev-dota-2',
    description: 'Local seed MOBA title for tournament flows.',
  },
  {
    key: 'counter-strike-2',
    name: 'Counter-Strike 2',
    slug: 'phase1-dev-counter-strike-2',
    description: 'Local seed FPS title for tournament flows.',
  },
] as const;
