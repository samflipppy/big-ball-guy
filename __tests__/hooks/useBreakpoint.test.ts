import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

describe('useBreakpoint', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let resizeListeners: Array<() => void>;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    resizeListeners = [];

    // Track resize listeners
    const origAdd = window.addEventListener.bind(window);
    const origRemove = window.removeEventListener.bind(window);

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler, options) => {
      if (event === 'resize') {
        resizeListeners.push(handler as () => void);
      }
      origAdd(event, handler, options);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler, options) => {
      if (event === 'resize') {
        resizeListeners = resizeListeners.filter((l) => l !== handler);
      }
      origRemove(event, handler, options);
    });
  });

  afterEach(() => {
    // Restore original dimensions
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

  function triggerResize() {
    window.dispatchEvent(new Event('resize'));
  }

  it('returns desktop breakpoint for width > 1024', () => {
    setWindowSize(1200, 800);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });

  it('returns tablet breakpoint for width 768-1024', () => {
    setWindowSize(800, 600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('returns mobile breakpoint for width < 768', () => {
    setWindowSize(375, 667);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('returns width 768 as tablet (boundary)', () => {
    setWindowSize(768, 600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('returns width 1024 as tablet (upper boundary)', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('returns width 1025 as desktop', () => {
    setWindowSize(1025, 768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');
    expect(result.current.isDesktop).toBe(true);
  });

  it('returns width 767 as mobile', () => {
    setWindowSize(767, 600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
  });

  it('includes width and height in result', () => {
    setWindowSize(1024, 768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('updates breakpoint when window is resized', () => {
    setWindowSize(1200, 800);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');

    // Resize to mobile
    act(() => {
      setWindowSize(375, 667);
      triggerResize();
    });

    expect(result.current.breakpoint).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
  });

  it('updates when resizing from mobile to tablet', () => {
    setWindowSize(375, 667);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('mobile');

    act(() => {
      setWindowSize(800, 600);
      triggerResize();
    });

    expect(result.current.breakpoint).toBe('tablet');
    expect(result.current.isTablet).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    setWindowSize(1024, 768);
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useBreakpoint());

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
