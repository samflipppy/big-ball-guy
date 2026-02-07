import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorageQuota } from '@/hooks/useStorageQuota';

// ---------------------------------------------------------------------------
// Mock navigator.storage.estimate
// ---------------------------------------------------------------------------

let estimateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  estimateMock = vi.fn().mockResolvedValue({ usage: 0, quota: 0 });

  Object.defineProperty(navigator, 'storage', {
    value: { estimate: estimateMock },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStorageQuota', () => {
  it('returns initial zero values', () => {
    const { result } = renderHook(() => useStorageQuota());
    expect(result.current.usage).toBe(0);
    expect(result.current.quota).toBe(0);
    expect(result.current.percentUsed).toBe(0);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isCritical).toBe(false);
  });

  it('updates with estimated values after initial call', async () => {
    estimateMock.mockResolvedValue({ usage: 500_000, quota: 1_000_000 });

    const { result } = renderHook(() => useStorageQuota());

    // Flush the initial async estimate call (advance just past 0 to avoid
    // infinite-loop from setInterval with runAllTimersAsync)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.usage).toBe(500_000);
    expect(result.current.quota).toBe(1_000_000);
    expect(result.current.percentUsed).toBe(50);
  });

  it('sets isWarning true at 80%', async () => {
    estimateMock.mockResolvedValue({ usage: 800, quota: 1000 });

    const { result } = renderHook(() => useStorageQuota());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.isCritical).toBe(false);
  });

  it('sets isCritical true at 95%', async () => {
    estimateMock.mockResolvedValue({ usage: 950, quota: 1000 });

    const { result } = renderHook(() => useStorageQuota());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isCritical).toBe(true);
    expect(result.current.isWarning).toBe(true); // 95 >= 80
  });

  it('polls at the specified interval', async () => {
    estimateMock.mockResolvedValue({ usage: 100, quota: 1000 });

    renderHook(() => useStorageQuota({ pollInterval: 5000 }));

    // Initial call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const initialCallCount = estimateMock.mock.calls.length;

    // Advance by one interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(estimateMock.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('handles estimate throwing an error gracefully', async () => {
    estimateMock.mockRejectedValue(new Error('not allowed'));

    const { result } = renderHook(() => useStorageQuota());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    // Should remain at zero defaults
    expect(result.current.usage).toBe(0);
    expect(result.current.quota).toBe(0);
  });

  it('returns percentUsed 0 when quota is 0', async () => {
    estimateMock.mockResolvedValue({ usage: 100, quota: 0 });

    const { result } = renderHook(() => useStorageQuota());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.percentUsed).toBe(0);
  });

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useStorageQuota());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('rounds percentUsed to whole number', async () => {
    estimateMock.mockResolvedValue({ usage: 333, quota: 1000 });

    const { result } = renderHook(() => useStorageQuota());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.percentUsed).toBe(33);
    expect(Number.isInteger(result.current.percentUsed)).toBe(true);
  });
});
