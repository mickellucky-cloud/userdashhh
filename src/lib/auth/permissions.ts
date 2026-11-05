/**
 * lib/auth/permissions.ts
 *
 * Admin role hierarchy + permission system.
 *
 * 4 roles in descending privilege: super_admin > admin > moderator > support
 * Super admins are bootstrapped via ADMIN_TELEGRAM_IDS env var.
 * They promote/demote others via the admin panel.
 *
 * DEFECT 12: AdminRole + ADMIN_ROLES are imported from @okn/shared (the zod
 * schema is the single source of truth) so a role add/rename cannot diverge
 * across web, bot, and the API client.
 */
import { type AdminRole, ADMIN_ROLES as SHARED_ADMIN_ROLES } from '@okn/shared';

// === ROLES ===
export { type AdminRole };
export const ADMIN_ROLES = SHARED_ADMIN_ROLES;

/**
 * Role hierarchy level: 0 = highest (super_admin), 3 = lowest (support).
 * Lower number = more privilege.
 */
const ROLE_LEVELS: Record<AdminRole, number> = {
  super_admin: 0,
  admin: 1,
  moderator: 2,
  support: 3,
};

export function getRoleLevel(role: AdminRole): number {
  return ROLE_LEVELS[role];
}

// === PERMISSIONS ===
/**
 * Granular permission keys. Each maps to a minimum role level.
 * If a role's level <= the permission's required level, access is granted.
 */
export const PERMISSIONS = {
  // Super admin only (level 0)
  CONTRACT_UPGRADE: 'contract_upgrade',
  BNB_WITHDRAW: 'bnb_withdraw',
  ROLE_MANAGE: 'role_manage',
  CONTRACT_SETTINGS: 'contract_settings',

  // Admin (level 1)
  SALE_CONFIG: 'sale_config',
  COMMIT_ROOT: 'commit_root',
  SET_CLAIM_FEE: 'set_claim_fee',
  TASK_DELETE: 'task_delete',
  USER_BAN: 'user_ban',
  WALLET_BIND: 'wallet_bind',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_DATA: 'export_data',
  REWARD_CONFIG: 'reward_config',

  // Moderator (level 2)
  TASK_MANAGE: 'task_manage',
  TASK_APPROVE: 'task_approve',
  WALLET_REBIND_APPROVE: 'wallet_rebind_approve',
  USER_SUSPEND: 'user_suspend',

  // Support (level 3) — read-only
  VIEW_STATS: 'view_stats',
  VIEW_USERS: 'view_users',
  VIEW_PURCHASES: 'view_purchases',
  VIEW_TASKS: 'view_tasks',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Minimum role level required for each permission.
 */
const PERMISSION_LEVELS: Record<Permission, number> = {
  // Super admin
  contract_upgrade: 0,
  bnb_withdraw: 0,
  role_manage: 0,
  contract_settings: 0,

  // Admin
  sale_config: 1,
  commit_root: 1,
  set_claim_fee: 1,
  task_delete: 1,
  user_ban: 1,
  wallet_bind: 1,
  view_audit_logs: 1,
  export_data: 1,
  reward_config: 1,

  // Moderator
  task_manage: 2,
  task_approve: 2,
  wallet_rebind_approve: 2,
  user_suspend: 2,

  // Support (read-only)
  view_stats: 3,
  view_users: 3,
  view_purchases: 3,
  view_tasks: 3,
};

/**
 * Check if a role has a specific permission.
 * A role has permission if its level <= the permission's required level.
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const roleLevel = ROLE_LEVELS[role];
  const requiredLevel = PERMISSION_LEVELS[permission];
  return roleLevel <= requiredLevel;
}

/**
 * Quick check: is this user any kind of admin?
 */
export function isAdmin(role: AdminRole | null | undefined): boolean {
  return role !== null && role !== undefined && ADMIN_ROLES.includes(role);
}

// === ROUTE PERMISSIONS ===
export type AdminRoute =
  | '/admin'
  | '/admin/token'
  | '/admin/users'
  | '/admin/tasks'
  | '/admin/claims'
  | '/admin/missions'
  | '/admin/leaderboard'
  | '/admin/settings'
  | '/admin/profile'
  | '/admin/transactions'
  | '/admin/audit-logs'
  | '/admin/activity'
  | '/admin/purchases'
  | '/admin/system';

/**
 * Minimum role required to access each admin route.
 */
const ROUTE_MIN_ROLES: Record<string, number> = {
  '/admin': 3, // all admin roles
  '/admin/token': 3, // all admin roles (read-only supply/sale data)
  '/admin/users': 3, // support can view, moderator+ can act
  '/admin/tasks': 2, // moderator+ can manage tasks
  '/admin/claims': 1, // admin+ can commit roots
  '/admin/missions': 1, // admin+ can manage missions
  '/admin/leaderboard': 1, // admin+ can view + trigger snapshots
  '/admin/settings': 1, // admin+ can view settings
  '/admin/profile': 3, // every admin manages their own account/2FA/appearance
  '/admin/transactions': 1, // admin+ can view Safe transactions
  '/admin/audit-logs': 1, // admin+ can view audit logs
  '/admin/activity': 3, // all admin roles can read the activity feed (IP/UA admin+ only)
  '/admin/purchases': 3, // all admin roles can read purchases (read-only)
  '/admin/system': 1, // admin+ can view ops/system health
};

/**
 * Check if a role can access a given admin route.
 */
export function canAccessRoute(
  role: AdminRole | null | undefined,
  route: string,
): boolean {
  if (!role || !isAdmin(role)) return false;
  // Match the longest prefix (e.g. /admin/users matches before /admin)
  const matchingRoute = Object.keys(ROUTE_MIN_ROLES)
    .filter((r) => route.startsWith(r))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchingRoute) return false;
  return ROLE_LEVELS[role] <= ROUTE_MIN_ROLES[matchingRoute]!;
}

/**
 * Admin sidebar nav items with their required minimum role level.
 * Used by the admin layout to filter the sidebar.
 */
export const ADMIN_NAV = [
  { href: '/admin' as AdminRoute, label: 'Overview', minLevel: 3 },
  { href: '/admin/token' as AdminRoute, label: 'Token', minLevel: 3 },
  { href: '/admin/users' as AdminRoute, label: 'Users', minLevel: 3 },
  { href: '/admin/tasks' as AdminRoute, label: 'Tasks', minLevel: 2 },
  { href: '/admin/claims' as AdminRoute, label: 'Claims', minLevel: 1 },
  { href: '/admin/missions' as AdminRoute, label: 'Missions', minLevel: 1 },
  { href: '/admin/leaderboard' as AdminRoute, label: 'Leaderboard', minLevel: 1 },
  { href: '/admin/settings' as AdminRoute, label: 'Settings', minLevel: 1 },
  { href: '/admin/profile' as AdminRoute, label: 'Profile', minLevel: 3 },
  { href: '/admin/transactions' as AdminRoute, label: 'Transactions', minLevel: 1 },
  { href: '/admin/audit-logs' as AdminRoute, label: 'Audit Logs', minLevel: 1 },
  { href: '/admin/activity' as AdminRoute, label: 'Activity', minLevel: 3 },
  { href: '/admin/purchases' as AdminRoute, label: 'Purchases', minLevel: 3 },
  { href: '/admin/system' as AdminRoute, label: 'System', minLevel: 1 },
];

/**
 * Filter nav items to only those the user's role can access.
 */
export function getVisibleNav(role: AdminRole | null | undefined) {
  if (!role) return [];
  const level = ROLE_LEVELS[role];
  return ADMIN_NAV.filter((item) => level <= item.minLevel);
}
