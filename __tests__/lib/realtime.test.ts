import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

// Track subscribe callbacks for simulating status changes
let subscribeCallbacks: Map<string, (status: string) => void> = new Map();
let trackCalls: { channelId: string; payload: unknown }[] = [];
let removedChannels: unknown[] = [];
let createdChannels: string[] = [];

const mockChannel = (channelId: string) => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback: (status: string) => void) => {
      subscribeCallbacks.set(channelId, callback);
      return channel;
    }),
    track: vi.fn((payload: unknown) => {
      trackCalls.push({ channelId, payload });
    }),
    presenceState: vi.fn(() => ({})),
    unsubscribe: vi.fn(),
  };
  return channel;
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: vi.fn((channelId: string) => {
      createdChannels.push(channelId);
      return mockChannel(channelId);
    }),
    removeChannel: vi.fn((channel: unknown) => {
      removedChannels.push(channel);
    }),
  }),
}));

import {
  subscribeToPlay,
  subscribeToPlaybook,
  broadcastPresence,
  unsubscribe,
  getConnectionState,
  onConnectionStateChange,
  unsubscribeAll,
} from '@/lib/realtime';

describe('realtime', () => {
  beforeEach(() => {
    // Clean up all channels between tests
    unsubscribeAll();
    subscribeCallbacks.clear();
    trackCalls = [];
    removedChannels = [];
    createdChannels = [];
  });

  describe('subscribeToPlay', () => {
    it('returns a channel ID with play: prefix', () => {
      const channelId = subscribeToPlay('play-123', vi.fn());
      expect(channelId).toBe('play:play-123');
    });

    it('creates a Supabase channel subscription', () => {
      subscribeToPlay('play-456', vi.fn());
      expect(createdChannels).toContain('play:play-456');
    });

    it('does not duplicate channels when called twice with same playId', () => {
      subscribeToPlay('play-789', vi.fn());
      subscribeToPlay('play-789', vi.fn());
      // Only one channel should be created
      const playChannels = createdChannels.filter((c) => c === 'play:play-789');
      expect(playChannels).toHaveLength(1);
    });

    it('starts in connecting state', () => {
      const channelId = subscribeToPlay('play-conn', vi.fn());
      expect(getConnectionState(channelId)).toBe('connecting');
    });

    it('transitions to connected when SUBSCRIBED', () => {
      const channelId = subscribeToPlay('play-sub', vi.fn());
      const cb = subscribeCallbacks.get(channelId);
      cb?.('SUBSCRIBED');
      expect(getConnectionState(channelId)).toBe('connected');
    });

    it('transitions to error on CHANNEL_ERROR', () => {
      const channelId = subscribeToPlay('play-err', vi.fn());
      const cb = subscribeCallbacks.get(channelId);
      cb?.('CHANNEL_ERROR');
      expect(getConnectionState(channelId)).toBe('error');
    });

    it('transitions to disconnected on CLOSED', () => {
      const channelId = subscribeToPlay('play-close', vi.fn());
      const cb = subscribeCallbacks.get(channelId);
      cb?.('CLOSED');
      expect(getConnectionState(channelId)).toBe('disconnected');
    });
  });

  describe('subscribeToPlaybook', () => {
    it('returns a channel ID with playbook: prefix', () => {
      const channelId = subscribeToPlaybook('team-abc', vi.fn());
      expect(channelId).toBe('playbook:team-abc');
    });

    it('creates a Supabase channel subscription', () => {
      subscribeToPlaybook('team-def', vi.fn());
      expect(createdChannels).toContain('playbook:team-def');
    });

    it('does not duplicate channels for the same team', () => {
      subscribeToPlaybook('team-dup', vi.fn());
      subscribeToPlaybook('team-dup', vi.fn());
      const teamChannels = createdChannels.filter((c) => c === 'playbook:team-dup');
      expect(teamChannels).toHaveLength(1);
    });
  });

  describe('broadcastPresence', () => {
    it('returns a channel ID with presence: prefix', () => {
      const channelId = broadcastPresence('play-100', 'user-1', { x: 10, y: 20 });
      expect(channelId).toBe('presence:play-100');
    });

    it('creates a presence channel', () => {
      broadcastPresence('play-200', 'user-2', null);
      expect(createdChannels).toContain('presence:play-200');
    });

    it('tracks presence when channel becomes subscribed', () => {
      const channelId = broadcastPresence('play-300', 'user-3', { x: 5, y: 10 }, 'Coach Smith', '#ff0000');
      const cb = subscribeCallbacks.get(channelId);
      cb?.('SUBSCRIBED');

      const tracked = trackCalls.find((t) => t.channelId === channelId);
      expect(tracked).toBeDefined();
      expect(tracked!.payload).toMatchObject({
        userId: 'user-3',
        name: 'Coach Smith',
        color: '#ff0000',
        cursor: { x: 5, y: 10 },
      });
    });

    it('updates presence on subsequent calls', () => {
      const channelId = broadcastPresence('play-400', 'user-4', { x: 0, y: 0 });
      const cb = subscribeCallbacks.get(channelId);
      cb?.('SUBSCRIBED');

      // Second call should update the track
      broadcastPresence('play-400', 'user-4', { x: 50, y: 100 });
      const lastTrack = trackCalls[trackCalls.length - 1];
      expect(lastTrack.payload).toMatchObject({
        userId: 'user-4',
        cursor: { x: 50, y: 100 },
      });
    });
  });

  describe('unsubscribe', () => {
    it('removes the channel from the registry', () => {
      const channelId = subscribeToPlay('play-unsub', vi.fn());
      expect(getConnectionState(channelId)).toBe('connecting');

      unsubscribe(channelId);
      expect(getConnectionState(channelId)).toBe('disconnected');
    });

    it('calls removeChannel on the Supabase client', () => {
      const channelId = subscribeToPlay('play-rm', vi.fn());
      unsubscribe(channelId);
      expect(removedChannels.length).toBeGreaterThan(0);
    });

    it('does nothing when called with unknown channel ID', () => {
      expect(() => unsubscribe('unknown-channel')).not.toThrow();
    });
  });

  describe('onConnectionStateChange', () => {
    it('calls listener when state changes', () => {
      const channelId = subscribeToPlay('play-listen', vi.fn());
      const listener = vi.fn();
      onConnectionStateChange(channelId, listener);

      const cb = subscribeCallbacks.get(channelId);
      cb?.('SUBSCRIBED');

      expect(listener).toHaveBeenCalledWith('connected');
    });

    it('returns an unsubscribe function', () => {
      const channelId = subscribeToPlay('play-unsub-listen', vi.fn());
      const listener = vi.fn();
      const off = onConnectionStateChange(channelId, listener);

      off();

      const cb = subscribeCallbacks.get(channelId);
      cb?.('SUBSCRIBED');

      // Listener should not be called after unsubscribing
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribeAll', () => {
    it('removes all active channels', () => {
      subscribeToPlay('play-a', vi.fn());
      subscribeToPlay('play-b', vi.fn());
      subscribeToPlaybook('team-a', vi.fn());

      unsubscribeAll();

      expect(getConnectionState('play:play-a')).toBe('disconnected');
      expect(getConnectionState('play:play-b')).toBe('disconnected');
      expect(getConnectionState('playbook:team-a')).toBe('disconnected');
    });
  });
});
