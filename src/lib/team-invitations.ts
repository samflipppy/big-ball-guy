/**
 * Team Invitation Flow (#312)
 *
 * Create, validate, accept, and revoke team invitations with token-based
 * authentication and expiry enforcement.
 */

// ---- Types ----

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitedBy?: string;
  acceptedBy?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface InvitationValidationResult {
  valid: boolean;
  invitation?: TeamInvitation;
  error?: string;
}

// ---- Constants ----

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VALID_ROLES = ['head_coach', 'coordinator', 'position_coach', 'player', 'viewer'];

// ---- In-memory store (simulates database) ----

const invitationStore = new Map<string, TeamInvitation>();

/** Reset store -- exposed for testing */
export function _resetStore(): void {
  invitationStore.clear();
}

/** Get all invitations -- exposed for testing */
export function _getAllInvitations(): TeamInvitation[] {
  return Array.from(invitationStore.values());
}

// ---- Helpers ----

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Public API ----

/**
 * Create a new team invitation.
 */
export function createInvitation(
  teamId: string,
  email: string,
  role: string,
  invitedBy?: string,
): TeamInvitation {
  if (!teamId || teamId.trim() === '') {
    throw new Error('Team ID is required');
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throw new Error('Valid email address is required');
  }

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Valid roles: ${VALID_ROLES.join(', ')}`);
  }

  // Check for duplicate pending invitation
  for (const inv of invitationStore.values()) {
    if (
      inv.teamId === teamId &&
      inv.email.toLowerCase() === email.trim().toLowerCase() &&
      inv.status === 'pending'
    ) {
      throw new Error(`A pending invitation already exists for ${email} on this team`);
    }
  }

  const now = new Date();
  const invitation: TeamInvitation = {
    id: generateId(),
    teamId,
    email: email.trim().toLowerCase(),
    role,
    token: generateToken(),
    status: 'pending',
    invitedBy,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + INVITATION_EXPIRY_MS).toISOString(),
  };

  invitationStore.set(invitation.id, invitation);

  return invitation;
}

/**
 * Validate an invitation token. Checks existence, status, and expiry.
 */
export function validateInvitation(token: string): InvitationValidationResult {
  if (!token || token.trim() === '') {
    return { valid: false, error: 'Token is required' };
  }

  let found: TeamInvitation | undefined;
  for (const inv of invitationStore.values()) {
    if (inv.token === token) {
      found = inv;
      break;
    }
  }

  if (!found) {
    return { valid: false, error: 'Invitation not found' };
  }

  if (found.status === 'revoked') {
    return { valid: false, error: 'Invitation has been revoked', invitation: found };
  }

  if (found.status === 'accepted') {
    return { valid: false, error: 'Invitation has already been accepted', invitation: found };
  }

  // Check expiry
  const now = new Date();
  const expiresAt = new Date(found.expiresAt);
  if (now > expiresAt) {
    found.status = 'expired';
    invitationStore.set(found.id, found);
    return { valid: false, error: 'Invitation has expired', invitation: found };
  }

  return { valid: true, invitation: found };
}

/**
 * Accept an invitation. Adds the user to the team.
 * Returns the updated invitation.
 */
export function acceptInvitation(
  token: string,
  userId: string,
): TeamInvitation {
  const validation = validateInvitation(token);

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid invitation');
  }

  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  const invitation = validation.invitation!;
  invitation.status = 'accepted';
  invitation.acceptedBy = userId;
  invitation.acceptedAt = new Date().toISOString();

  invitationStore.set(invitation.id, invitation);

  return invitation;
}

/**
 * Revoke a pending invitation.
 */
export function revokeInvitation(invitationId: string): TeamInvitation {
  const invitation = invitationStore.get(invitationId);

  if (!invitation) {
    throw new Error(`Invitation not found: ${invitationId}`);
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Cannot revoke invitation with status: ${invitation.status}`);
  }

  invitation.status = 'revoked';
  invitationStore.set(invitationId, invitation);

  return invitation;
}

/**
 * Get all pending invitations for a team.
 */
export function getPendingInvitations(teamId: string): TeamInvitation[] {
  const now = new Date();
  const result: TeamInvitation[] = [];

  for (const inv of invitationStore.values()) {
    if (inv.teamId !== teamId) continue;
    if (inv.status !== 'pending') continue;

    // Auto-expire
    if (new Date(inv.expiresAt) < now) {
      inv.status = 'expired';
      invitationStore.set(inv.id, inv);
      continue;
    }

    result.push(inv);
  }

  // Sort by creation date descending (newest first)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}
