import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// --- Mock realtime module ---
const mockSubscribeToPlay = vi.fn().mockReturnValue('play:test-play');
const mockBroadcastPresence = vi.fn().mockReturnValue('presence:test-play');
const mockUnsubscribe = vi.fn();
const mockGetConnectionState = vi.fn().mockReturnValue('disconnected');
const mockOnConnectionStateChange = vi.fn().mockReturnValue(() => {});
const mockGetPresenceState = vi.fn().mockReturnValue([]);

vi.mock('@/lib/realtime', () => ({
  subscribeToPlay: (...args: unknown[]) => mockSubscribeToPlay(...args),
  broadcastPresence: (...args: unknown[]) => mockBroadcastPresence(...args),
  unsubscribe: (...args: unknown[]) => mockUnsubscribe(...args),
  getConnectionState: (...args: unknown[]) => mockGetConnectionState(...args),
  onConnectionStateChange: (...args: unknown[]) => mockOnConnectionStateChange(...args),
  getPresenceState: (...args: unknown[]) => mockGetPresenceState(...args),
}));

import { useRealtime } from '@/hooks/useRealtime';

describe('useRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetConnectionState.mockReturnValue('disconnected');
    mockGetPresenceState.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns disconnected state initially when no playId', () => {
    const { result } = renderHook(() =>
      useRealtime({ playId: null, userId: 'user-1' }),
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.activeEditors).toEqual([]);
  });

  it('subscribes when playId is provided', () => {
    renderHook(() =>
      useRealtime({ playId: 'play-1', userId: 'user-1' }),
    );

    expect(mockSubscribeToPlay).toHaveBeenCalledWith('play-1', expect.any(Function));
    expect(mockBroadcastPresence).toHaveBeenCalledWith(
      'play-1',
      'user-1',
      null,
      'Anonymous',
      '#2563eb',
    );
  });

  it('does not subscribe when enabled is false', () => {
    renderHook(() =>
      useRealtime({ playId: 'play-2', userId: 'user-1', enabled: false }),
    );

    expect(mockSubscribeToPlay).not.toHaveBeenCalled();
    expect(mockBroadcastPresence).not.toHaveBeenCalled();
  });

  it('does not subscribe when userId is null', () => {
    renderHook(() =>
      useRealtime({ playId: 'play-3', userId: null }),
    );

    expect(mockSubscribeToPlay).not.toHaveBeenCalled();
  });

  it('cleans up channels on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtime({ playId: 'play-4', userId: 'user-1' }),
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('re-subscribes when playId changes', () => {
    const { rerender } = renderHook(
      ({ playId }) => useRealtime({ playId, userId: 'user-1' }),
      { initialProps: { playId: 'play-a' as string | null } },
    );

    expect(mockSubscribeToPlay).toHaveBeenCalledTimes(1);

    rerender({ playId: 'play-b' });

    // Should have unsubscribed old and subscribed new
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockSubscribeToPlay).toHaveBeenCalledTimes(2);
  });

  it('registers a connection state listener', () => {
    renderHook(() =>
      useRealtime({ playId: 'play-5', userId: 'user-1' }),
    );

    expect(mockOnConnectionStateChange).toHaveBeenCalledWith(
      'play:test-play',
      expect.any(Function),
    );
  });

  it('debounces outgoing cursor broadcasts', () => {
    const { result } = renderHook(() =>
      useRealtime({ playId: 'play-6', userId: 'user-1', debounceMs: 100 }),
    );

    act(() => {
      result.current.broadcastCursor({ x: 10, y: 20 });
    });

    // Should not have called broadcastPresence again yet (after the initial one)
    const initialCallCount = mockBroadcastPresence.mock.calls.length;

    act(() => {
      result.current.broadcastCursor({ x: 20, y: 30 });
    });

    // Still debounced
    expect(mockBroadcastPresence.mock.calls.length).toBe(initialCallCount);

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Now the last cursor should have been broadcast
    expect(mockBroadcastPresence.mock.calls.length).toBe(initialCallCount + 1);
    const lastCall = mockBroadcastPresence.mock.calls[mockBroadcastPresence.mock.calls.length - 1];
    expect(lastCall[2]).toEqual({ x: 20, y: 30 });
  });

  it('provides subscribe and unsubscribe functions', () => {
    const { result } = renderHook(() =>
      useRealtime({ playId: null, userId: 'user-1' }),
    );

    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('passes userName and userColor to broadcastPresence', () => {
    renderHook(() =>
      useRealtime({
        playId: 'play-7',
        userId: 'user-1',
        userName: 'Coach Smith',
        userColor: '#ff0000',
      }),
    );

    expect(mockBroadcastPresence).toHaveBeenCalledWith(
      'play-7',
      'user-1',
      null,
      'Coach Smith',
      '#ff0000',
    );
  });

  it('polls presence state on interval', async () => {
    mockGetPresenceState.mockReturnValue([
      { userId: 'user-2', name: 'Coach B', color: '#00ff00', cursor: { x: 50, y: 60 } },
    ]);

    const { result } = renderHook(() =>
      useRealtime({ playId: 'play-8', userId: 'user-1' }),
    );

    // Advance the polling interval (1 second)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.activeEditors).toEqual([
      { userId: 'user-2', name: 'Coach B', color: '#00ff00', cursor: { x: 50, y: 60 } },
    ]);
  });

  it('filters out the current user from active editors', async () => {
    mockGetPresenceState.mockReturnValue([
      { userId: 'user-1', name: 'Coach A', color: '#0000ff', cursor: null },
      { userId: 'user-2', name: 'Coach B', color: '#00ff00', cursor: { x: 10, y: 20 } },
    ]);

    const { result } = renderHook(() =>
      useRealtime({ playId: 'play-9', userId: 'user-1' }),
    );

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Should only include user-2, not user-1
    expect(result.current.activeEditors).toHaveLength(1);
    expect(result.current.activeEditors[0].userId).toBe('user-2');
  });
});
