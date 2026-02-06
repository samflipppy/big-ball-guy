import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInvitation,
  validateInvitation,
  acceptInvitation,
  revokeInvitation,
  getPendingInvitations,
  _resetStore,
  _getAllInvitations,
} from '@/lib/team-invitations';

describe('team-invitations', () => {
  beforeEach(() => {
    _resetStore();
  });

  describe('createInvitation', () => {
    it('creates an invitation with pending status', () => {
      const inv = createInvitation('team-1', 'coach@school.edu', 'coordinator');
      expect(inv.status).toBe('pending');
      expect(inv.email).toBe('coach@school.edu');
      expect(inv.role).toBe('coordinator');
      expect(inv.teamId).toBe('team-1');
    });

    it('generates a unique token', () => {
      const inv1 = createInvitation('team-1', 'a@test.com', 'viewer');
      const inv2 = createInvitation('team-1', 'b@test.com', 'viewer');
      expect(inv1.token).not.toBe(inv2.token);
    });

    it('generates a unique id', () => {
      const inv1 = createInvitation('team-1', 'a@test.com', 'viewer');
      const inv2 = createInvitation('team-1', 'b@test.com', 'viewer');
      expect(inv1.id).not.toBe(inv2.id);
    });

    it('sets expiration to 7 days from now', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'player');
      const expiresAt = new Date(inv.expiresAt).getTime();
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(expiresAt - now).toBeGreaterThan(sevenDays - 5000);
      expect(expiresAt - now).toBeLessThanOrEqual(sevenDays + 1000);
    });

    it('throws for empty team ID', () => {
      expect(() => createInvitation('', 'c@test.com', 'viewer')).toThrow('Team ID is required');
    });

    it('throws for invalid email', () => {
      expect(() => createInvitation('team-1', 'not-email', 'viewer')).toThrow('Valid email address is required');
    });

    it('throws for invalid role', () => {
      expect(() => createInvitation('team-1', 'c@test.com', 'admin')).toThrow('Invalid role');
    });

    it('throws for duplicate pending invitation', () => {
      createInvitation('team-1', 'coach@test.com', 'coordinator');
      expect(() => createInvitation('team-1', 'coach@test.com', 'viewer')).toThrow('pending invitation already exists');
    });

    it('normalizes email to lowercase', () => {
      const inv = createInvitation('team-1', 'Coach@School.EDU', 'coordinator');
      expect(inv.email).toBe('coach@school.edu');
    });

    it('records the invitedBy user', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer', 'user-admin');
      expect(inv.invitedBy).toBe('user-admin');
    });
  });

  describe('validateInvitation', () => {
    it('returns valid for a fresh invitation', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      const result = validateInvitation(inv.token);
      expect(result.valid).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitation!.id).toBe(inv.id);
    });

    it('returns invalid for unknown token', () => {
      const result = validateInvitation('nonexistent-token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns invalid for empty token', () => {
      const result = validateInvitation('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('returns invalid for revoked invitation', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      revokeInvitation(inv.id);
      const result = validateInvitation(inv.token);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('revoked');
    });

    it('returns invalid for already-accepted invitation', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      acceptInvitation(inv.token, 'user-1');
      const result = validateInvitation(inv.token);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already been accepted');
    });
  });

  describe('acceptInvitation', () => {
    it('marks the invitation as accepted', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'player');
      const accepted = acceptInvitation(inv.token, 'user-1');
      expect(accepted.status).toBe('accepted');
      expect(accepted.acceptedBy).toBe('user-1');
      expect(accepted.acceptedAt).toBeDefined();
    });

    it('throws for invalid token', () => {
      expect(() => acceptInvitation('bad-token', 'user-1')).toThrow();
    });

    it('throws for empty userId', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      expect(() => acceptInvitation(inv.token, '')).toThrow('User ID is required');
    });

    it('throws when trying to accept an already accepted invitation', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      acceptInvitation(inv.token, 'user-1');
      expect(() => acceptInvitation(inv.token, 'user-2')).toThrow();
    });
  });

  describe('revokeInvitation', () => {
    it('marks the invitation as revoked', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      const revoked = revokeInvitation(inv.id);
      expect(revoked.status).toBe('revoked');
    });

    it('throws for non-existent invitation', () => {
      expect(() => revokeInvitation('nonexistent')).toThrow('not found');
    });

    it('throws when invitation is not pending', () => {
      const inv = createInvitation('team-1', 'c@test.com', 'viewer');
      acceptInvitation(inv.token, 'user-1');
      expect(() => revokeInvitation(inv.id)).toThrow('Cannot revoke');
    });
  });

  describe('getPendingInvitations', () => {
    it('returns all pending invitations for a team', () => {
      createInvitation('team-1', 'a@test.com', 'viewer');
      createInvitation('team-1', 'b@test.com', 'player');
      createInvitation('team-2', 'c@test.com', 'viewer');

      const pending = getPendingInvitations('team-1');
      expect(pending.length).toBe(2);
    });

    it('does not include accepted invitations', () => {
      const inv = createInvitation('team-1', 'a@test.com', 'viewer');
      createInvitation('team-1', 'b@test.com', 'player');
      acceptInvitation(inv.token, 'user-1');

      const pending = getPendingInvitations('team-1');
      expect(pending.length).toBe(1);
      expect(pending[0].email).toBe('b@test.com');
    });

    it('does not include revoked invitations', () => {
      const inv = createInvitation('team-1', 'a@test.com', 'viewer');
      createInvitation('team-1', 'b@test.com', 'player');
      revokeInvitation(inv.id);

      const pending = getPendingInvitations('team-1');
      expect(pending.length).toBe(1);
    });

    it('returns empty array for a team with no invitations', () => {
      const pending = getPendingInvitations('team-empty');
      expect(pending).toEqual([]);
    });

    it('sorts by creation date descending (newest first)', () => {
      createInvitation('team-1', 'first@test.com', 'viewer');
      createInvitation('team-1', 'second@test.com', 'viewer');

      const pending = getPendingInvitations('team-1');
      expect(pending.length).toBe(2);
      const firstDate = new Date(pending[0].createdAt).getTime();
      const secondDate = new Date(pending[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    });
  });
});
