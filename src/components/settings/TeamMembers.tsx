'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  createInvitation,
  getPendingInvitations,
  revokeInvitation,
  type TeamInvitation,
} from '@/lib/team-invitations';
import type { TeamMember, UserRole } from '@/types';

interface TeamMembersProps {
  teamId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  members: TeamMember[];
  onMemberRemove?: (memberId: string) => void;
  onRoleChange?: (memberId: string, newRole: UserRole) => void;
  className?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  head_coach: 'Head Coach',
  coordinator: 'Coordinator',
  position_coach: 'Position Coach',
  player: 'Player',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  head_coach: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  coordinator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  position_coach: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  player: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  viewer: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
};

const INVITABLE_ROLES: UserRole[] = ['coordinator', 'position_coach', 'player', 'viewer'];

export function TeamMembers({
  teamId,
  currentUserId,
  currentUserRole,
  members,
  onMemberRemove,
  onRoleChange,
  className,
}: TeamMembersProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('position_coach');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [showPending, setShowPending] = useState(false);

  // Check if current user can manage team
  const canManageTeam = currentUserRole === 'head_coach' || currentUserRole === 'coordinator';

  // Load pending invitations
  const loadPendingInvitations = useCallback(() => {
    try {
      const invitations = getPendingInvitations(teamId);
      setPendingInvitations(invitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, [teamId]);

  // Handle invite submit
  const handleInvite = useCallback(() => {
    setInviteError('');
    setInviteSuccess('');

    try {
      const invitation = createInvitation(teamId, inviteEmail, inviteRole, currentUserId);
      setInviteSuccess(`Invitation sent to ${invitation.email}`);
      setInviteEmail('');
      loadPendingInvitations();

      // In a real app, this would send an email with the invitation link
      // For now, just log the token
      console.log('Invitation token (would be emailed):', invitation.token);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  }, [teamId, inviteEmail, inviteRole, currentUserId, loadPendingInvitations]);

  // Handle revoke invitation
  const handleRevokeInvitation = useCallback((invitationId: string) => {
    try {
      revokeInvitation(invitationId);
      loadPendingInvitations();
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
    }
  }, [loadPendingInvitations]);

  // Open invite modal
  const handleOpenInviteModal = useCallback(() => {
    setInviteEmail('');
    setInviteRole('position_coach');
    setInviteError('');
    setInviteSuccess('');
    loadPendingInvitations();
    setInviteModalOpen(true);
  }, [loadPendingInvitations]);

  // Sort members by role
  const sortedMembers = useMemo(() => {
    const roleOrder: UserRole[] = ['head_coach', 'coordinator', 'position_coach', 'player', 'viewer'];
    return [...members].sort((a, b) => {
      return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
    });
  }, [members]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Team Members
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {members.length} member{members.length !== 1 ? 's' : ''} on this team
          </p>
        </div>
        {canManageTeam && (
          <Button variant="primary" size="sm" onClick={handleOpenInviteModal}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Coach
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        {sortedMembers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>No team members yet</p>
          </div>
        ) : (
          sortedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {member.displayName || member.email}
                    {member.userId === currentUserId && (
                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(You)</span>
                    )}
                  </p>
                  {member.displayName && member.email && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role badge */}
                <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', ROLE_COLORS[member.role])}>
                  {ROLE_LABELS[member.role]}
                </span>

                {/* Actions */}
                {canManageTeam && member.userId !== currentUserId && member.role !== 'head_coach' && (
                  <div className="flex items-center gap-1">
                    {onRoleChange && (
                      <select
                        value={member.role}
                        onChange={(e) => onRoleChange(member.userId, e.target.value as UserRole)}
                        className="text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1"
                      >
                        {INVITABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    )}
                    {onMemberRemove && (
                      <button
                        onClick={() => onMemberRemove(member.userId)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition-colors"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Invitations Toggle */}
      {canManageTeam && (
        <button
          onClick={() => {
            if (!showPending) loadPendingInvitations();
            setShowPending(!showPending);
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showPending ? 'Hide' : 'Show'} pending invitations ({pendingInvitations.length})
        </button>
      )}

      {/* Pending Invitations List */}
      {showPending && pendingInvitations.length > 0 && (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-700 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{inv.email}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Invited as {ROLE_LABELS[inv.role as UserRole]} • Expires{' '}
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRevokeInvitation(inv.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} size="sm">
        <ModalHeader>Invite a Coach</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="coach@school.edu"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INVITABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {inviteRole === 'coordinator' && 'Can create and edit plays, game plans, and manage team'}
                {inviteRole === 'position_coach' && 'Can create and edit plays and game plans'}
                {inviteRole === 'player' && 'Can view plays and practice scripts'}
                {inviteRole === 'viewer' && 'Can only view plays (read-only access)'}
              </p>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                {inviteSuccess}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default TeamMembers;
