import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrientationLock } from '@/hooks/useOrientationLock';

describe('useOrientationLock', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let mockLock: ReturnType<typeof vi.fn>;
  let mockUnlock: ReturnType<typeof vi.fn>;
  let orientationListeners: Array<() => void>;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    mockLock = vi.fn().mockResolvedValue(undefined);
    mockUnlock = vi.fn();
    orientationListeners = [];

    // Mock screen.orientation
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      configurable: true,
      value: {
        type: 'landscape-primary',
        angle: 0,
        lock: mockLock,
        unlock: mockUnlock,
        addEventListener: (_event: string, fn: () => void) => {
          orientationListeners.push(fn);
        },
        removeEventListener: (_event: string, fn: () => void) => {
          orientationListeners = orientationListeners.filter((l) => l !== fn);
        },
        dispatchEvent: () => false,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    vi.restoreAllMocks();
  });

  function setWindowSize(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  }

  it('returns landscape orientation when width >= height', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    expect(result.current.currentOrientation).toBe('landscape');
  });

  it('returns portrait orientation when height > width', () => {
    setWindowSize(768, 1024);
    const { result } = renderHook(() => useOrientationLock());

    expect(result.current.currentOrientation).toBe('portrait');
  });

  it('starts unlocked', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    expect(result.current.isLocked).toBe(false);
  });

  it('locks orientation using Screen Orientation API', async () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    await act(async () => {
      await result.current.lock();
    });

    expect(mockLock).toHaveBeenCalledWith('landscape');
    expect(result.current.isLocked).toBe(true);
  });

  it('unlocks orientation using Screen Orientation API', async () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    await act(async () => {
      await result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);

    act(() => {
      result.current.unlock();
    });

    expect(mockUnlock).toHaveBeenCalled();
    expect(result.current.isLocked).toBe(false);
  });

  it('falls back gracefully when lock API is not available', async () => {
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      configurable: true,
      value: {
        type: 'landscape-primary',
        angle: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        // No lock/unlock methods
      },
    });

    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    await act(async () => {
      await result.current.lock();
    });

    // Should still mark as locked for UI fallback
    expect(result.current.isLocked).toBe(true);
  });

  it('handles lock API throwing an error', async () => {
    mockLock.mockRejectedValue(new DOMException('Not supported'));

    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    await act(async () => {
      await result.current.lock();
    });

    // Should still mark as locked for the rotate overlay fallback
    expect(result.current.isLocked).toBe(true);
  });

  it('updates orientation on resize', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useOrientationLock());

    expect(result.current.currentOrientation).toBe('landscape');

    act(() => {
      setWindowSize(768, 1024);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.currentOrientation).toBe('portrait');
  });

  it('cleans up event listeners on unmount', () => {
    setWindowSize(1024, 768);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOrientationLock());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('treats equal width and height as landscape', () => {
    setWindowSize(768, 768);
    const { result } = renderHook(() => useOrientationLock());

    expect(result.current.currentOrientation).toBe('landscape');
  });
});
