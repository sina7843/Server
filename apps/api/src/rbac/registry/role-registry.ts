import type { RegisteredRole } from './registry.types';

export const RoleRegistry = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'System role with all registered permissions.',
    isSystem: true,
    isAssignable: false,
    isActive: true,
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'System administration role for foundation admin capabilities.',
    isSystem: true,
    isAssignable: true,
    isActive: true,
  },
  {
    key: 'content_manager',
    name: 'Content Manager',
    description: 'Content-management foundation role.',
    isSystem: true,
    isAssignable: true,
    isActive: true,
  },
  {
    key: 'support',
    name: 'Support',
    description: 'Limited support foundation role.',
    isSystem: true,
    isAssignable: true,
    isActive: true,
  },
  {
    key: 'user',
    name: 'User',
    description: 'Base authenticated user role placeholder.',
    isSystem: true,
    isAssignable: true,
    isActive: true,
  },
  {
    key: 'tournament_manager',
    name: 'Tournament Manager',
    description: 'Phase 1 esports tournament management role.',
    isSystem: true,
    isAssignable: true,
    isActive: true,
  },
] as const satisfies readonly RegisteredRole[];
