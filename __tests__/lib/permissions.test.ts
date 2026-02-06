import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canAccessFeature,
  getPermissionsForRole,
  isAtLeast,
  Permission,
  ROLE_PERMISSIONS,
} from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

describe('hasPermission()', () => {
  it('owner has all permissions', () => {
    for (const perm of Object.values(Permission)) {
      expect(hasPermission('owner', perm)).toBe(true);
    }
  });

  it('viewer can only view plays and game plans', () => {
    expect(hasPermission('viewer', Permission.VIEW_PLAYS)).toBe(true);
    expect(hasPermission('viewer', Permission.VIEW_GAME_PLAN)).toBe(true);
    expect(hasPermission('viewer', Permission.EDIT_PLAYS)).toBe(false);
    expect(hasPermission('viewer', Permission.DELETE_PLAYS)).toBe(false);
    expect(hasPermission('viewer', Permission.MANAGE_TEAM)).toBe(false);
    expect(hasPermission('viewer', Permission.MANAGE_BILLING)).toBe(false);
  });

  it('head-coach cannot manage billing', () => {
    expect(hasPermission('head-coach', Permission.MANAGE_BILLING)).toBe(false);
    // But can do most other things
    expect(hasPermission('head-coach', Permission.EDIT_PLAYS)).toBe(true);
    expect(hasPermission('head-coach', Permission.DELETE_PLAYS)).toBe(true);
    expect(hasPermission('head-coach', Permission.MANAGE_TEAM)).toBe(true);
  });

  it('coordinator can edit but not delete plays', () => {
    expect(hasPermission('coordinator', Permission.EDIT_PLAYS)).toBe(true);
    expect(hasPermission('coordinator', Permission.DELETE_PLAYS)).toBe(false);
  });

  it('position-coach can edit plays but not create game plans', () => {
    expect(hasPermission('position-coach', Permission.EDIT_PLAYS)).toBe(true);
    expect(hasPermission('position-coach', Permission.CREATE_GAME_PLAN)).toBe(false);
    expect(hasPermission('position-coach', Permission.VIEW_GAME_PLAN)).toBe(true);
  });
});

describe('canAccessFeature()', () => {
  it('owner can access all mapped features', () => {
    expect(canAccessFeature('owner', 'playbook')).toBe(true);
    expect(canAccessFeature('owner', 'billing')).toBe(true);
    expect(canAccessFeature('owner', 'roster')).toBe(true);
    expect(canAccessFeature('owner', 'wristband')).toBe(true);
  });

  it('viewer can access playbook but not play-editor', () => {
    expect(canAccessFeature('viewer', 'playbook')).toBe(true);
    expect(canAccessFeature('viewer', 'play-editor')).toBe(false);
  });

  it('returns false for unknown features', () => {
    expect(canAccessFeature('owner', 'nonexistent-feature')).toBe(false);
    expect(canAccessFeature('viewer', 'unknown')).toBe(false);
  });

  it('requires ALL permissions for multi-permission features', () => {
    // wristband requires VIEW_GAME_PLAN + EXPORT
    expect(canAccessFeature('coordinator', 'wristband')).toBe(true);
    expect(canAccessFeature('position-coach', 'wristband')).toBe(false); // no EXPORT
    expect(canAccessFeature('viewer', 'wristband')).toBe(false);
  });

  it('position-coach can access game-plan view but not editor', () => {
    expect(canAccessFeature('position-coach', 'game-plan')).toBe(true);
    expect(canAccessFeature('position-coach', 'game-plan-editor')).toBe(false);
  });
});

describe('getPermissionsForRole()', () => {
  it('returns a copy of the permissions array', () => {
    const perms = getPermissionsForRole('owner');
    const original = ROLE_PERMISSIONS['owner'];
    expect(perms).toEqual(original);
    // Modifying the returned array should not affect the original
    perms.push(Permission.VIEW_PLAYS);
    expect(getPermissionsForRole('owner')).toEqual(original);
  });

  it('returns correct count for each role', () => {
    expect(getPermissionsForRole('owner').length).toBe(9);
    expect(getPermissionsForRole('viewer').length).toBe(2);
  });
});

describe('isAtLeast()', () => {
  it('owner is at least every role', () => {
    const roles: Role[] = ['owner', 'head-coach', 'coordinator', 'position-coach', 'viewer'];
    for (const role of roles) {
      expect(isAtLeast('owner', role)).toBe(true);
    }
  });

  it('viewer is at least viewer but not higher', () => {
    expect(isAtLeast('viewer', 'viewer')).toBe(true);
    expect(isAtLeast('viewer', 'position-coach')).toBe(false);
    expect(isAtLeast('viewer', 'owner')).toBe(false);
  });

  it('coordinator is at least position-coach', () => {
    expect(isAtLeast('coordinator', 'position-coach')).toBe(true);
    expect(isAtLeast('coordinator', 'coordinator')).toBe(true);
    expect(isAtLeast('coordinator', 'head-coach')).toBe(false);
  });

  it('same role is at least itself', () => {
    const roles: Role[] = ['owner', 'head-coach', 'coordinator', 'position-coach', 'viewer'];
    for (const role of roles) {
      expect(isAtLeast(role, role)).toBe(true);
    }
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('every role includes VIEW_PLAYS', () => {
    const roles: Role[] = ['owner', 'head-coach', 'coordinator', 'position-coach', 'viewer'];
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role]).toContain(Permission.VIEW_PLAYS);
    }
  });

  it('only owner has MANAGE_BILLING', () => {
    const roles: Role[] = ['head-coach', 'coordinator', 'position-coach', 'viewer'];
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(Permission.MANAGE_BILLING);
    }
    expect(ROLE_PERMISSIONS['owner']).toContain(Permission.MANAGE_BILLING);
  });
});
