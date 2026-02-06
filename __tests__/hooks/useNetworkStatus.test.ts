import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('returns isOnline true when browser is online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline false when browser is offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
  });

  it('initializes wasOffline as false when online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.wasOffline).toBe(false);
  });

  it('sets lastOnlineAt to a valid ISO string when online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.lastOnlineAt).not.toBeNull();
    expect(() => new Date(result.current.lastOnlineAt!)).not.toThrow();
  });

  it('sets lastOnlineAt to null when initially offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.lastOnlineAt).toBeNull();
  });

  it('updates isOnline to false when offline event fires', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates isOnline to true when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('sets wasOffline to true after going offline', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.wasOffline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.wasOffline).toBe(true);
  });

  it('keeps wasOffline true after coming back online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.wasOffline).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it('updates lastOnlineAt when coming back online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    const initialLastOnlineAt = result.current.lastOnlineAt;

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // lastOnlineAt should not change when going offline
    expect(result.current.lastOnlineAt).toBe(initialLastOnlineAt);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // lastOnlineAt should be updated when coming back online
    expect(result.current.lastOnlineAt).not.toBeNull();
  });

  it('calls onOnline callback when going online', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    const onOnline = vi.fn();
    renderHook(() => useNetworkStatus({ onOnline }));

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(onOnline).toHaveBeenCalledTimes(1);
  });

  it('calls onOffline callback when going offline', () => {
    const onOffline = vi.fn();
    renderHook(() => useNetworkStatus({ onOffline }));

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(onOffline).toHaveBeenCalledTimes(1);
  });

  it('does not call onOnline when going offline', () => {
    const onOnline = vi.fn();
    renderHook(() => useNetworkStatus({ onOnline }));

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(onOnline).not.toHaveBeenCalled();
  });

  it('does not call onOffline when going online', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    const onOffline = vi.fn();
    renderHook(() => useNetworkStatus({ onOffline }));

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(onOffline).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    const removedEvents = removeEventListenerSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain('online');
    expect(removedEvents).toContain('offline');
  });
});
