import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRLSSQL,
  validateTeamAccess,
  hasMinimumRole,
  getPolicyTables,
  getPoliciesForTable,
  addTeamMember,
  clearTeamMembers,
  DEFAULT_RLS_POLICIES,
  type RLSPolicy,
} from '@/lib/security/rls-policies';

describe('rls-policies', () => {
  beforeEach(() => {
    clearTeamMembers();
  });

  // --- DEFAULT_RLS_POLICIES ---

  describe('DEFAULT_RLS_POLICIES', () => {
    it('defines policies for all required tables', () => {
      const tables = getPolicyTables(DEFAULT_RLS_POLICIES);
      expect(tables).toContain('plays');
      expect(tables).toContain('formations');
      expect(tables).toContain('game_plans');
      expect(tables).toContain('teams');
      expect(tables).toContain('team_members');
    });

    it('defines all four operations for plays', () => {
      const playPolicies = getPoliciesForTable(DEFAULT_RLS_POLICIES, 'plays');
      const ops = playPolicies.map((p) => p.operation);
      expect(ops).toContain('select');
      expect(ops).toContain('insert');
      expect(ops).toContain('update');
      expect(ops).toContain('delete');
    });

    it('scopes plays to team via team_id', () => {
      const playPolicies = getPoliciesForTable(DEFAULT_RLS_POLICIES, 'plays');
      for (const p of playPolicies) {
        expect(p.condition).toContain('team_id');
      }
    });
  });

  // --- generateRLSSQL ---

  describe('generateRLSSQL', () => {
    it('generates ALTER TABLE for each unique table', () => {
      const policies: RLSPolicy[] = [
        { table: 'plays', operation: 'select', condition: 'true' },
        { table: 'plays', operation: 'insert', condition: 'true' },
        { table: 'formations', operation: 'select', condition: 'true' },
      ];
      const sql = generateRLSSQL(policies);
      expect(sql).toContain('ALTER TABLE plays ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE formations ENABLE ROW LEVEL SECURITY;');
    });

    it('generates CREATE POLICY for each policy entry', () => {
      const policies: RLSPolicy[] = [
        { table: 'plays', operation: 'select', condition: 'team_id = current_user_team_id()' },
        { table: 'plays', operation: 'delete', condition: 'team_id = current_user_team_id()' },
      ];
      const sql = generateRLSSQL(policies);
      expect(sql).toContain('CREATE POLICY plays_select_policy ON plays FOR SELECT');
      expect(sql).toContain('CREATE POLICY plays_delete_policy ON plays FOR DELETE');
    });

    it('includes the USING clause with the condition', () => {
      const policies: RLSPolicy[] = [
        { table: 'teams', operation: 'select', condition: 'id = auth.uid()' },
      ];
      const sql = generateRLSSQL(policies);
      expect(sql).toContain('USING (id = auth.uid())');
    });

    it('handles empty policy array without errors', () => {
      const sql = generateRLSSQL([]);
      expect(sql).toBe('');
    });

    it('generates valid SQL for the full default policy set', () => {
      const sql = generateRLSSQL(DEFAULT_RLS_POLICIES);
      expect(sql).toContain('ALTER TABLE plays ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE formations ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE game_plans ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE teams ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;');
    });
  });

  // --- validateTeamAccess ---

  describe('validateTeamAccess', () => {
    it('returns allowed when user is a member of the team', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'position_coach' });
      const result = validateTeamAccess('user-1', 'team-1');
      expect(result.allowed).toBe(true);
      expect(result.role).toBe('position_coach');
    });

    it('returns not allowed when user is not a member', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'head_coach' });
      const result = validateTeamAccess('user-2', 'team-1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not a member');
    });

    it('returns not allowed when userId is empty', () => {
      const result = validateTeamAccess('', 'team-1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing');
    });

    it('returns not allowed when teamId is empty', () => {
      const result = validateTeamAccess('user-1', '');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing');
    });

    it('grants access when user role meets required role', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'coordinator' });
      const result = validateTeamAccess('user-1', 'team-1', 'position_coach');
      expect(result.allowed).toBe(true);
    });

    it('denies access when user role is below required role', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'viewer' });
      const result = validateTeamAccess('user-1', 'team-1', 'coordinator');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient role');
    });

    it('grants head_coach access to any required role', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'head_coach' });
      const result = validateTeamAccess('user-1', 'team-1', 'head_coach');
      expect(result.allowed).toBe(true);
    });

    it('denies player access when coordinator role is required', () => {
      addTeamMember({ userId: 'user-1', teamId: 'team-1', role: 'player' });
      const result = validateTeamAccess('user-1', 'team-1', 'coordinator');
      expect(result.allowed).toBe(false);
    });
  });

  // --- hasMinimumRole ---

  describe('hasMinimumRole', () => {
    it('head_coach meets head_coach requirement', () => {
      expect(hasMinimumRole('head_coach', 'head_coach')).toBe(true);
    });

    it('viewer does not meet player requirement', () => {
      expect(hasMinimumRole('viewer', 'player')).toBe(false);
    });

    it('coordinator meets position_coach requirement', () => {
      expect(hasMinimumRole('coordinator', 'position_coach')).toBe(true);
    });

    it('player does not meet coordinator requirement', () => {
      expect(hasMinimumRole('player', 'coordinator')).toBe(false);
    });
  });

  // --- getPolicyTables / getPoliciesForTable ---

  describe('getPolicyTables', () => {
    it('returns unique table names', () => {
      const policies: RLSPolicy[] = [
        { table: 'plays', operation: 'select', condition: 'true' },
        { table: 'plays', operation: 'insert', condition: 'true' },
        { table: 'formations', operation: 'select', condition: 'true' },
      ];
      const tables = getPolicyTables(policies);
      expect(tables).toEqual(['plays', 'formations']);
    });
  });

  describe('getPoliciesForTable', () => {
    it('returns only policies for the specified table', () => {
      const policies: RLSPolicy[] = [
        { table: 'plays', operation: 'select', condition: 'a' },
        { table: 'formations', operation: 'select', condition: 'b' },
        { table: 'plays', operation: 'delete', condition: 'c' },
      ];
      const result = getPoliciesForTable(policies, 'plays');
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.table === 'plays')).toBe(true);
    });
  });
});
