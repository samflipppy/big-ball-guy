import { createClient } from '@/lib/supabase/client';
import type { PlayId, TeamId, UserId, Position } from '@/types';

// --- Connection State ---
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// --- Presence Payload ---
export interface PresencePayload {
  userId: UserId;
  name: string;
  color: string;
  cursor: Position | null;
  lastActive: string;
}

// --- Channel Registry ---
interface ChannelEntry {
  channel: ReturnType<ReturnType<typeof createClient>['channel']>;
  state: ConnectionState;
}

const channels = new Map<string, ChannelEntry>();
const stateListeners = new Map<string, Set<(state: ConnectionState) => void>>();

// --- Helpers ---

function notifyStateListeners(channelId: string, state: ConnectionState) {
  const listeners = stateListeners.get(channelId);
  if (listeners) {
    for (const listener of listeners) {
      listener(state);
    }
  }
}

function setChannelState(channelId: string, state: ConnectionState) {
  const entry = channels.get(channelId);
  if (entry) {
    entry.state = state;
  }
  notifyStateListeners(channelId, state);
}

// --- Public API ---

/**
 * Subscribe to real-time changes on a specific play.
 * Fires callback whenever the play row is updated.
 */
export function subscribeToPlay(
  playId: PlayId,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
): string {
  const channelId = `play:${playId}`;

  if (channels.has(channelId)) {
    return channelId;
  }

  const supabase = createClient();
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes' as 'system',
      {
        event: '*',
        schema: 'public',
        table: 'plays',
        filter: `id=eq.${playId}`,
      } as Record<string, unknown> as { event: 'system'; schema: string },
      (payload: unknown) => {
        callback(payload as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
      },
    );

  channels.set(channelId, { channel, state: 'connecting' });
  setChannelState(channelId, 'connecting');

  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      setChannelState(channelId, 'connected');
    } else if (status === 'CHANNEL_ERROR') {
      setChannelState(channelId, 'error');
    } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
      setChannelState(channelId, 'disconnected');
    }
  });

  return channelId;
}

/**
 * Subscribe to playbook-level changes for a team (new plays, deletions).
 */
export function subscribeToPlaybook(
  teamId: TeamId,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
): string {
  const channelId = `playbook:${teamId}`;

  if (channels.has(channelId)) {
    return channelId;
  }

  const supabase = createClient();
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes' as 'system',
      {
        event: '*',
        schema: 'public',
        table: 'plays',
        filter: `team_id=eq.${teamId}`,
      } as Record<string, unknown> as { event: 'system'; schema: string },
      (payload: unknown) => {
        callback(payload as { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> });
      },
    );

  channels.set(channelId, { channel, state: 'connecting' });
  setChannelState(channelId, 'connecting');

  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      setChannelState(channelId, 'connected');
    } else if (status === 'CHANNEL_ERROR') {
      setChannelState(channelId, 'error');
    } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
      setChannelState(channelId, 'disconnected');
    }
  });

  return channelId;
}

/**
 * Broadcast the current user's presence (cursor position) on a play channel.
 */
export function broadcastPresence(
  playId: PlayId,
  userId: UserId,
  cursor: Position | null,
  name: string = 'Anonymous',
  color: string = '#2563eb',
): string {
  const channelId = `presence:${playId}`;

  const supabase = createClient();
  let entry = channels.get(channelId);

  if (!entry) {
    const channel = supabase.channel(channelId, {
      config: { presence: { key: userId } },
    });

    entry = { channel, state: 'connecting' };
    channels.set(channelId, entry);

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setChannelState(channelId, 'connected');
        channel.track({
          userId,
          name,
          color,
          cursor,
          lastActive: new Date().toISOString(),
        });
      } else if (status === 'CHANNEL_ERROR') {
        setChannelState(channelId, 'error');
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        setChannelState(channelId, 'disconnected');
      }
    });
  } else {
    // Channel exists — just update the tracked presence
    entry.channel.track({
      userId,
      name,
      color,
      cursor,
      lastActive: new Date().toISOString(),
    });
  }

  return channelId;
}

/**
 * Unsubscribe and remove a channel by its ID.
 */
export function unsubscribe(channelId: string): void {
  const entry = channels.get(channelId);
  if (!entry) return;

  const supabase = createClient();
  supabase.removeChannel(entry.channel);
  channels.delete(channelId);
  stateListeners.delete(channelId);
  setChannelState(channelId, 'disconnected');
}

/**
 * Get the current connection state of a channel.
 */
export function getConnectionState(channelId: string): ConnectionState {
  return channels.get(channelId)?.state ?? 'disconnected';
}

/**
 * Register a listener for connection state changes on a channel.
 */
export function onConnectionStateChange(
  channelId: string,
  listener: (state: ConnectionState) => void,
): () => void {
  if (!stateListeners.has(channelId)) {
    stateListeners.set(channelId, new Set());
  }
  stateListeners.get(channelId)!.add(listener);

  return () => {
    stateListeners.get(channelId)?.delete(listener);
  };
}

/**
 * Unsubscribe from all active channels. Useful on logout / unmount.
 */
export function unsubscribeAll(): void {
  for (const channelId of Array.from(channels.keys())) {
    unsubscribe(channelId);
  }
}

/**
 * Get the presence state for a play's presence channel.
 */
export function getPresenceState(playId: PlayId): PresencePayload[] {
  const channelId = `presence:${playId}`;
  const entry = channels.get(channelId);
  if (!entry) return [];

  const presenceState = entry.channel.presenceState<PresencePayload>();
  const editors: PresencePayload[] = [];

  for (const key of Object.keys(presenceState)) {
    const presences = presenceState[key];
    if (presences && presences.length > 0) {
      editors.push(presences[0] as PresencePayload);
    }
  }

  return editors;
}
