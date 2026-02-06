/**
 * Multi-tenant Row Level Security policies.
 *
 * Defines RLS policies for PostgreSQL tables and provides utilities
 * for generating SQL and validating team-scoped access.
 */

import type { UserId, TeamId, UserRole } from '@/types';

// --- Types ---

export type RLSOperation = 'select' | 'insert' | 'update' | 'delete';

export interface RLSPolicy {
  table: string;
  operation: RLSOperation;
  condition: string;
}

export interface TeamAccessResult {
  allowed: boolean;
  role?: UserRole;
  reason?: string;
}

// --- In-memory team member store (simulates DB) ---

export interface TeamMemberRecord {
  userId: UserId;
  teamId: TeamId;
  role: UserRole;
}

const teamMembersStore: TeamMemberRecord[] = [];

/**
 * Add a team member record (for testing / in-memory usage).
 */
export function addTeamMember(record: TeamMemberRecord): void {
  teamMembersStore.push(record);
}

/**
 * Clear all team member records (for testing).
 */
export function clearTeamMembers(): void {
  teamMembersStore.length = 0;
}

// --- Role hierarchy ---

const ROLE_HIERARCHY: Record<UserRole, number> = {
  head_coach: 4,
  coordinator: 3,
  position_coach: 2,
  player: 1,
  viewer: 0,
};

// --- Default RLS policies ---

export const DEFAULT_RLS_POLICIES: RLSPolicy[] = [
  // plays
  { table: 'plays', operation: 'select', condition: 'team_id = current_user_team_id()' },
  { table: 'plays', operation: 'insert', condition: 'team_id = current_user_team_id()' },
  { table: 'plays', operation: 'update', condition: 'team_id = current_user_team_id()' },
  { table: 'plays', operation: 'delete', condition: 'team_id = current_user_team_id()' },

  // formations
  { table: 'formations', operation: 'select', condition: 'team_id = current_user_team_id()' },
  { table: 'formations', operation: 'insert', condition: 'team_id = current_user_team_id()' },
  { table: 'formations', operation: 'update', condition: 'team_id = current_user_team_id()' },
  { table: 'formations', operation: 'delete', condition: 'team_id = current_user_team_id()' },

  // game_plans
  { table: 'game_plans', operation: 'select', condition: 'team_id = current_user_team_id()' },
  { table: 'game_plans', operation: 'insert', condition: 'team_id = current_user_team_id()' },
  { table: 'game_plans', operation: 'update', condition: 'team_id = current_user_team_id()' },
  { table: 'game_plans', operation: 'delete', condition: 'team_id = current_user_team_id()' },

  // teams
  { table: 'teams', operation: 'select', condition: 'id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())' },
  { table: 'teams', operation: 'update', condition: "id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach')" },
  { table: 'teams', operation: 'delete', condition: "id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach')" },

  // team_members
  { table: 'team_members', operation: 'select', condition: 'team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())' },
  { table: 'team_members', operation: 'insert', condition: "team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('head_coach', 'coordinator'))" },
  { table: 'team_members', operation: 'update', condition: "team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach')" },
  { table: 'team_members', operation: 'delete', condition: "team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach')" },
];

// --- SQL Generation ---

/**
 * Generate a policy name from table and operation.
 */
function policyName(table: string, operation: RLSOperation): string {
  return `${table}_${operation}_policy`;
}

/**
 * Map an RLS operation to the PostgreSQL command keyword.
 */
function operationToCommand(operation: RLSOperation): string {
  return operation.toUpperCase();
}

/**
 * Generate PostgreSQL RLS policy SQL statements from a set of policy definitions.
 * Includes ALTER TABLE to enable RLS and CREATE POLICY statements.
 */
export function generateRLSSQL(policies: RLSPolicy[]): string {
  const lines: string[] = [];

  // Collect unique tables
  const tables = [...new Set(policies.map((p) => p.table))];

  // Enable RLS on each table
  for (const table of tables) {
    lines.push(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
  }

  lines.push('');

  // Create each policy
  for (const policy of policies) {
    const name = policyName(policy.table, policy.operation);
    const command = operationToCommand(policy.operation);
    const using = `USING (${policy.condition})`;

    lines.push(
      `CREATE POLICY ${name} ON ${policy.table} FOR ${command} ${using};`,
    );
  }

  return lines.join('\n');
}

// --- Access validation ---

/**
 * Validate whether a user has access to a team, optionally requiring a minimum role.
 * Uses the in-memory team members store.
 */
export function validateTeamAccess(
  userId: UserId,
  teamId: TeamId,
  requiredRole?: UserRole,
): TeamAccessResult {
  if (!userId || !teamId) {
    return { allowed: false, reason: 'Missing userId or teamId' };
  }

  const membership = teamMembersStore.find(
    (m) => m.userId === userId && m.teamId === teamId,
  );

  if (!membership) {
    return { allowed: false, reason: 'User is not a member of this team' };
  }

  if (requiredRole) {
    const userLevel = ROLE_HIERARCHY[membership.role];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        role: membership.role,
        reason: `Insufficient role: ${membership.role} < ${requiredRole}`,
      };
    }
  }

  return { allowed: true, role: membership.role };
}

/**
 * Check whether a role meets or exceeds a required role level.
 */
export function hasMinimumRole(role: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all tables that have RLS policies defined.
 */
export function getPolicyTables(policies: RLSPolicy[]): string[] {
  return [...new Set(policies.map((p) => p.table))];
}

/**
 * Get policies for a specific table.
 */
export function getPoliciesForTable(
  policies: RLSPolicy[],
  table: string,
): RLSPolicy[] {
  return policies.filter((p) => p.table === table);
}
