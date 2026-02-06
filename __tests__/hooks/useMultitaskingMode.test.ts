import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultitaskingMode } from '@/hooks/useMultitaskingMode';

describe('useMultitaskingMode', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalScreenWidth: number;
  let matchMediaListeners: Map<string, (() => void)[]>;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalScreenWidth = screen.width;
    matchMediaListeners = new Map();

    // Mock matchMedia with change listener support
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => {
        const listeners: (() => void)[] = [];
        matchMediaListeners.set(query, listeners);
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
          removeEventListener: (_event: string, fn: () => void) => {
            const idx = listeners.indexOf(fn);
            if (idx >= 0) listeners.splice(idx, 1);
          },
          dispatchEvent: () => false,
        };
      },
    });
  });

  afterEach(() => {
    setWindowSize(originalInnerWidth, originalInnerHeight);
    Object.defineProperty(screen, 'width', {
      writable: true,
      configurable: true,
      value: originalScreenWidth,
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

  function setScreenWidth(width: number) {
    Object.defineProperty(screen, 'width', {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  it('returns full screen mode when window matches screen width', () => {
    setScreenWidth(1024);
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isFullScreen).toBe(true);
    expect(result.current.isSplitView).toBe(false);
    expect(result.current.isSlideOver).toBe(false);
  });

  it('returns correct available dimensions', () => {
    setScreenWidth(1024);
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.availableWidth).toBe(1024);
    expect(result.current.availableHeight).toBe(768);
  });

  it('detects Slide Over mode (narrow width with large screen)', () => {
    setScreenWidth(1024);
    setWindowSize(320, 768);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isSlideOver).toBe(true);
    expect(result.current.isFullScreen).toBe(false);
    expect(result.current.isSplitView).toBe(false);
  });

  it('detects Split View mode (medium width with large screen)', () => {
    setScreenWidth(1024);
    setWindowSize(507, 768); // 507 < 1024 * 0.75 = 768
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isSplitView).toBe(true);
    expect(result.current.isFullScreen).toBe(false);
    expect(result.current.isSlideOver).toBe(false);
  });

  it('returns full screen for non-iPad devices with small screen width', () => {
    setScreenWidth(375); // iPhone-sized screen
    setWindowSize(375, 812);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isFullScreen).toBe(true);
    expect(result.current.isSplitView).toBe(false);
    expect(result.current.isSlideOver).toBe(false);
  });

  it('detects full screen at 75%+ of screen width', () => {
    setScreenWidth(1024);
    setWindowSize(800, 768); // 800 >= 1024 * 0.75 = 768
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isFullScreen).toBe(true);
    expect(result.current.isSplitView).toBe(false);
  });

  it('updates when window resizes', () => {
    setScreenWidth(1024);
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isFullScreen).toBe(true);

    // Simulate entering split view
    act(() => {
      setWindowSize(507, 768);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isSplitView).toBe(true);
    expect(result.current.isFullScreen).toBe(false);
    expect(result.current.availableWidth).toBe(507);
  });

  it('updates when going from split view back to full screen', () => {
    setScreenWidth(1024);
    setWindowSize(507, 768);
    const { result } = renderHook(() => useMultitaskingMode());

    expect(result.current.isSplitView).toBe(true);

    act(() => {
      setWindowSize(1024, 768);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isFullScreen).toBe(true);
    expect(result.current.isSplitView).toBe(false);
  });

  it('handles iPad Pro 12.9" screen width', () => {
    setScreenWidth(1366);
    setWindowSize(678, 1024); // Split view on 12.9" iPad
    const { result } = renderHook(() => useMultitaskingMode());

    // 678 < 1366 * 0.75 = 1024.5 => split view
    expect(result.current.isSplitView).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    setScreenWidth(1024);
    setWindowSize(1024, 768);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useMultitaskingMode());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
