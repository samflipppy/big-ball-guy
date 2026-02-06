import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers debounced save when data changes', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: { count: 1 } } },
    );

    // Trigger a data change
    rerender({ data: { count: 2 } });

    // Before debounce fires
    expect(saveFn).not.toHaveBeenCalled();

    // Advance past the AUTO_SAVE_DELAY (1500ms)
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(saveFn).toHaveBeenCalled();
  });

  it('updates syncStatus after successful save', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: { v: 1 } } },
    );

    // Initially no lastSaved
    expect(result.current.syncStatus.lastSaved).toBeNull();

    rerender({ data: { v: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.syncStatus.lastSaved).not.toBeNull();
    expect(result.current.syncStatus.pendingChanges).toBe(0);
  });

  it('increments pendingChanges on data change', () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: 'a' } },
    );

    // Initial render triggers pendingChanges +1
    const initialPending = result.current.syncStatus.pendingChanges;

    rerender({ data: 'b' });
    expect(result.current.syncStatus.pendingChanges).toBeGreaterThan(initialPending);
  });

  it('forceSave bypasses debounce and saves immediately', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: { v: 1 } } },
    );

    await act(async () => {
      await result.current.forceSave();
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(result.current.syncStatus.lastSaved).not.toBeNull();
    expect(result.current.syncStatus.pendingChanges).toBe(0);
  });

  it('does not save when disabled', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ data, enabled }) => useAutoSave(data, saveFn, enabled),
      { initialProps: { data: { v: 1 }, enabled: false } },
    );

    rerender({ data: { v: 2 }, enabled: false });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(saveFn).not.toHaveBeenCalled();
  });

  it('tracks online/offline status', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: 'test' } },
    );

    // Simulate going offline
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.syncStatus.isOnline).toBe(false);

    // Simulate coming back online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.syncStatus.isOnline).toBe(true);
  });

  it('sets isSyncing during save operation', async () => {
    let resolveSave: () => void;
    const saveFn = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveSave = resolve; }),
    );

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, saveFn),
      { initialProps: { data: { v: 1 } } },
    );

    rerender({ data: { v: 2 } });

    // Advance timers to trigger debounce but don't resolve the save yet
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // The save should be in progress
    expect(saveFn).toHaveBeenCalled();

    // Resolve the save
    await act(async () => {
      resolveSave!();
    });

    expect(result.current.syncStatus.isSyncing).toBe(false);
  });
});
