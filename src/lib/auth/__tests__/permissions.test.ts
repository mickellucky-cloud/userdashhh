/**
 * lib/auth/__tests__/permissions.test.ts
 *
 * TDD RED phase: Tests for the admin role permission system.
 * These tests define the expected behavior BEFORE the implementation exists.
 *
 * 4 roles: super_admin > admin > moderator > support
 * Each role inherits the permissions of all roles below it in the hierarchy.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// These imports will fail until we implement them — that's the RED phase.
import {
  ADMIN_ROLES,
  ADMIN_NAV,
  type AdminRole,
  hasPermission,
  getRoleLevel,
  isAdmin,
  canAccessRoute,
  PERMISSIONS,
} from '../permissions';

describe('AdminRole hierarchy', () => {
  it('defines exactly 4 roles in descending order of privilege', () => {
    assert.equal(ADMIN_ROLES.length, 4);
    assert.equal(ADMIN_ROLES[0], 'super_admin');
    assert.equal(ADMIN_ROLES[1], 'admin');
    assert.equal(ADMIN_ROLES[2], 'moderator');
    assert.equal(ADMIN_ROLES[3], 'support');
  });

  it('assigns super_admin the highest level (0)', () => {
    assert.equal(getRoleLevel('super_admin'), 0);
  });

  it('assigns support the lowest level (3)', () => {
    assert.equal(getRoleLevel('support'), 3);
  });

  it('admin level is between super_admin and moderator', () => {
    assert.ok(getRoleLevel('admin') < getRoleLevel('moderator'));
    assert.ok(getRoleLevel('admin') > getRoleLevel('super_admin'));
  });
});

describe('isAdmin', () => {
  it('returns true for super_admin', () => {
    assert.equal(isAdmin('super_admin'), true);
  });

  it('returns true for admin', () => {
    assert.equal(isAdmin('admin'), true);
  });

  it('returns true for moderator', () => {
    assert.equal(isAdmin('moderator'), true);
  });

  it('returns true for support', () => {
    assert.equal(isAdmin('support'), true);
  });

  it('returns false for null (regular user)', () => {
    assert.equal(isAdmin(null), false);
  });

  it('returns false for undefined', () => {
    assert.equal(isAdmin(undefined), false);
  });
});

describe('hasPermission', () => {
  it('super_admin can do everything', () => {
    for (const perm of Object.values(PERMISSIONS)) {
      assert.equal(hasPermission('super_admin', perm), true);
    }
  });

  it('admin can manage sale config but not contract upgrades', () => {
    assert.equal(hasPermission('admin', PERMISSIONS.SALE_CONFIG), true);
    assert.equal(hasPermission('admin', PERMISSIONS.CONTRACT_UPGRADE), false);
    assert.equal(hasPermission('admin', PERMISSIONS.BNB_WITHDRAW), false);
  });

  it('moderator can manage tasks but not sale config', () => {
    assert.equal(hasPermission('moderator', PERMISSIONS.TASK_MANAGE), true);
    assert.equal(hasPermission('moderator', PERMISSIONS.SALE_CONFIG), false);
    assert.equal(hasPermission('moderator', PERMISSIONS.COMMIT_ROOT), false);
  });

  it('support has no write permissions', () => {
    assert.equal(hasPermission('support', PERMISSIONS.TASK_MANAGE), false);
    assert.equal(hasPermission('support', PERMISSIONS.USER_SUSPEND), false);
    assert.equal(hasPermission('support', PERMISSIONS.SALE_CONFIG), false);
  });

  it('support can view stats and users (read-only)', () => {
    assert.equal(hasPermission('support', PERMISSIONS.VIEW_STATS), true);
    assert.equal(hasPermission('support', PERMISSIONS.VIEW_USERS), true);
  });
});

describe('canAccessRoute', () => {
  it('all admin roles can access overview', () => {
    const roles: AdminRole[] = ['super_admin', 'admin', 'moderator', 'support'];
    for (const role of roles) {
      assert.equal(canAccessRoute(role, '/admin'), true);
    }
  });

  it('only super_admin and admin can access settings', () => {
    assert.equal(canAccessRoute('super_admin', '/admin/settings'), true);
    assert.equal(canAccessRoute('admin', '/admin/settings'), true);
    assert.equal(canAccessRoute('moderator', '/admin/settings'), false);
    assert.equal(canAccessRoute('support', '/admin/settings'), false);
  });

  it('moderator can access tasks', () => {
    assert.equal(canAccessRoute('moderator', '/admin/tasks'), true);
  });

  it('support can access token data (read-only)', () => {
    assert.equal(canAccessRoute('support', '/admin/token'), true);
  });

  it('support cannot access claims management', () => {
    assert.equal(canAccessRoute('support', '/admin/claims'), false);
  });

  it('only super_admin can access audit logs', () => {
    assert.equal(canAccessRoute('super_admin', '/admin/audit-logs'), true);
    assert.equal(canAccessRoute('admin', '/admin/audit-logs'), true);
    assert.equal(canAccessRoute('moderator', '/admin/audit-logs'), false);
  });

  it('null role (non-admin) cannot access any admin route', () => {
    assert.equal(canAccessRoute(null, '/admin'), false);
    assert.equal(canAccessRoute(null, '/admin/users'), false);
  });

  // Personal account/profile page — every admin manages their own 2FA,
  // appearance, and identity there, so ALL roles must reach it.
  it('all admin roles can access /admin/profile (personal account)', () => {
    const roles: AdminRole[] = ['super_admin', 'admin', 'moderator', 'support'];
    for (const role of roles) {
      assert.equal(canAccessRoute(role, '/admin/profile'), true);
    }
  });

  it('non-admin (null role) cannot access /admin/profile', () => {
    assert.equal(canAccessRoute(null, '/admin/profile'), false);
  });
});

describe('ADMIN_NAV', () => {
  it('includes /admin/profile as a sidebar entry', () => {
    assert.ok(
      ADMIN_NAV.some((n) => n.href === '/admin/profile'),
      'ADMIN_NAV must include /admin/profile',
    );
  });

  it('/admin/profile is visible to every admin role (minLevel 3)', () => {
    const item = ADMIN_NAV.find((n) => n.href === '/admin/profile');
    assert.ok(item, 'missing /admin/profile nav item');
    assert.equal(item!.minLevel, 3);
  });
});
