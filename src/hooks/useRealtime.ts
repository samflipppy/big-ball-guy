'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayId, UserId, Position } from '@/types';
import {
  subscribeToPlay,
  broadcastPresence,
  unsubscribe as realtimeUnsubscribe,
  getConnectionState,
  onConnectionStateChange,
  getPresenceState,
  type ConnectionState,
  type PresencePayload,
} from '@/lib/realtime';

// --- Types ---

export interface ActiveEditor {
  userId: UserId;
  name: string;
  color: string;
  cursor: Position | null;
}

export interface UseRealtimeOptions {
  playId: PlayId | null;
  userId: UserId | null;
  userName?: string;
  userColor?: string;
  /** Debounce interval for outgoing cursor updates (ms). Default 100. */
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  activeEditors: ActiveEditor[];
  subscribe: (playId: PlayId) => void;
  unsubscribe: () => void;
  broadcastCursor: (cursor: Position | null) => void;
}

// --- Hook ---

export function useRealtime({
  playId,
  userId,
  userName = 'Anonymous',
  userColor = '#2563eb',
  debounceMs = 100,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [activeEditors, setActiveEditors] = useState<ActiveEditor[]>([]);
  const channelIdsRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presencePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up all channels
  const cleanupChannels = useCallback(() => {
    for (const id of channelIdsRef.current) {
      realtimeUnsubscribe(id);
    }
    channelIdsRef.current = [];
    setActiveEditors([]);
    setConnectionState('disconnected');

    if (presencePollingRef.current) {
      clearInterval(presencePollingRef.current);
      presencePollingRef.current = null;
    }
  }, []);

  // Subscribe to a play
  const subscribe = useCallback(
    (targetPlayId: PlayId) => {
      if (!enabled || !userId) return;

      // Clean up previous subscriptions
      cleanupChannels();

      // Subscribe to play changes
      const playChannelId = subscribeToPlay(targetPlayId, () => {
        // Play data changed — consumers can react via their own data-fetching
      });
      channelIdsRef.current.push(playChannelId);

      // Broadcast presence
      const presenceChannelId = broadcastPresence(
        targetPlayId,
        userId,
        null,
        userName,
        userColor,
      );
      channelIdsRef.current.push(presenceChannelId);

      // Listen for connection state changes on the play channel
      const unsubState = onConnectionStateChange(playChannelId, (state) => {
        setConnectionState(state);
      });

      // Set initial state
      setConnectionState(getConnectionState(playChannelId));

      // Poll presence state to update active editors list
      presencePollingRef.current = setInterval(() => {
        const presences = getPresenceState(targetPlayId);
        const editors: ActiveEditor[] = presences
          .filter((p: PresencePayload) => p.userId !== userId)
          .map((p: PresencePayload) => ({
            userId: p.userId,
            name: p.name,
            color: p.color,
            cursor: p.cursor,
          }));
        setActiveEditors(editors);
      }, 1000);

      // Return cleanup for the state listener
      return () => {
        unsubState();
      };
    },
    [enabled, userId, userName, userColor, cleanupChannels],
  );

  // Unsubscribe from current play
  const unsubscribe = useCallback(() => {
    cleanupChannels();
  }, [cleanupChannels]);

  // Debounced cursor broadcast
  const broadcastCursor = useCallback(
    (cursor: Position | null) => {
      if (!enabled || !userId || !playId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        broadcastPresence(playId, userId, cursor, userName, userColor);
      }, debounceMs);
    },
    [enabled, userId, playId, userName, userColor, debounceMs],
  );

  // Auto-subscribe when playId changes
  useEffect(() => {
    if (playId && enabled && userId) {
      subscribe(playId);
    } else {
      cleanupChannels();
    }

    return () => {
      cleanupChannels();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playId, enabled, userId]);

  return {
    isConnected: connectionState === 'connected',
    connectionState,
    activeEditors,
    subscribe,
    unsubscribe,
    broadcastCursor,
  };
}
