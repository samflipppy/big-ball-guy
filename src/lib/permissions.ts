// ---- Roles ----

export type Role = 'owner' | 'head-coach' | 'coordinator' | 'position-coach' | 'viewer';

// ---- Permissions ----

export enum Permission {
  VIEW_PLAYS = 'view_plays',
  EDIT_PLAYS = 'edit_plays',
  DELETE_PLAYS = 'delete_plays',
  MANAGE_TEAM = 'manage_team',
  MANAGE_BILLING = 'manage_billing',
  EXPORT = 'export',
  SHARE = 'share',
  CREATE_GAME_PLAN = 'create_game_plan',
  VIEW_GAME_PLAN = 'view_game_plan',
}

// ---- Role-Permission mapping ----

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    Permission.VIEW_PLAYS,
    Permission.EDIT_PLAYS,
    Permission.DELETE_PLAYS,
    Permission.MANAGE_TEAM,
    Permission.MANAGE_BILLING,
    Permission.EXPORT,
    Permission.SHARE,
    Permission.CREATE_GAME_PLAN,
    Permission.VIEW_GAME_PLAN,
  ],
  'head-coach': [
    Permission.VIEW_PLAYS,
    Permission.EDIT_PLAYS,
    Permission.DELETE_PLAYS,
    Permission.MANAGE_TEAM,
    Permission.EXPORT,
    Permission.SHARE,
    Permission.CREATE_GAME_PLAN,
    Permission.VIEW_GAME_PLAN,
  ],
  coordinator: [
    Permission.VIEW_PLAYS,
    Permission.EDIT_PLAYS,
    Permission.EXPORT,
    Permission.SHARE,
    Permission.CREATE_GAME_PLAN,
    Permission.VIEW_GAME_PLAN,
  ],
  'position-coach': [
    Permission.VIEW_PLAYS,
    Permission.EDIT_PLAYS,
    Permission.VIEW_GAME_PLAN,
  ],
  viewer: [
    Permission.VIEW_PLAYS,
    Permission.VIEW_GAME_PLAN,
  ],
};

// ---- Feature-to-permission mapping ----

const FEATURE_PERMISSIONS: Record<string, Permission[]> = {
  playbook: [Permission.VIEW_PLAYS],
  'play-editor': [Permission.EDIT_PLAYS],
  'play-delete': [Permission.DELETE_PLAYS],
  'game-plan': [Permission.VIEW_GAME_PLAN],
  'game-plan-editor': [Permission.CREATE_GAME_PLAN],
  export: [Permission.EXPORT],
  share: [Permission.SHARE],
  'team-settings': [Permission.MANAGE_TEAM],
  billing: [Permission.MANAGE_BILLING],
  'call-sheet': [Permission.VIEW_GAME_PLAN],
  wristband: [Permission.VIEW_GAME_PLAN, Permission.EXPORT],
  'drill-cards': [Permission.VIEW_PLAYS, Permission.EXPORT],
  roster: [Permission.MANAGE_TEAM],
  'practice-script': [Permission.CREATE_GAME_PLAN],
};

// ---- Access checks ----

/**
 * Check if a user with the given role has a specific permission.
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a user with the given role can access a specific feature.
 *
 * A feature may require multiple permissions. The user must have ALL
 * required permissions to access the feature.
 *
 * If the feature is not in the mapping, access is denied by default.
 */
export function canAccessFeature(userRole: Role, feature: string): boolean {
  const requiredPermissions = FEATURE_PERMISSIONS[feature];
  if (!requiredPermissions || requiredPermissions.length === 0) return false;
  return requiredPermissions.every((perm) => hasPermission(userRole, perm));
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

/**
 * Check if a role is at least as privileged as another role.
 */
export function isAtLeast(userRole: Role, minimumRole: Role): boolean {
  const hierarchy: Role[] = ['owner', 'head-coach', 'coordinator', 'position-coach', 'viewer'];
  const userIndex = hierarchy.indexOf(userRole);
  const minIndex = hierarchy.indexOf(minimumRole);
  if (userIndex === -1 || minIndex === -1) return false;
  return userIndex <= minIndex;
}
