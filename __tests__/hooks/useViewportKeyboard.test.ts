import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewportKeyboard } from '@/hooks/useViewportKeyboard';

describe('useViewportKeyboard', () => {
  let resizeListeners: Array<() => void>;
  let scrollListeners: Array<() => void>;
  let mockVisualViewport: {
    height: number;
    width: number;
    offsetTop: number;
    offsetLeft: number;
    pageTop: number;
    pageLeft: number;
    scale: number;
    addEventListener: typeof vi.fn;
    removeEventListener: typeof vi.fn;
  };

  beforeEach(() => {
    resizeListeners = [];
    scrollListeners = [];

    mockVisualViewport = {
      height: 800,
      width: 400,
      offsetTop: 0,
      offsetLeft: 0,
      pageTop: 0,
      pageLeft: 0,
      scale: 1,
      addEventListener: vi.fn((event: string, fn: () => void) => {
        if (event === 'resize') resizeListeners.push(fn);
        if (event === 'scroll') scrollListeners.push(fn);
      }),
      removeEventListener: vi.fn((event: string, fn: () => void) => {
        if (event === 'resize') resizeListeners = resizeListeners.filter((l) => l !== fn);
        if (event === 'scroll') scrollListeners = scrollListeners.filter((l) => l !== fn);
      }),
    };

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function simulateKeyboardOpen(keyboardHeight: number) {
    mockVisualViewport.height = 800 - keyboardHeight;
    resizeListeners.forEach((fn) => fn());
  }

  function simulateKeyboardClose() {
    mockVisualViewport.height = 800;
    resizeListeners.forEach((fn) => fn());
  }

  it('starts with keyboard closed', () => {
    const { result } = renderHook(() => useViewportKeyboard());

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.visualViewportHeight).toBe(800);
  });

  it('detects keyboard opening when viewport shrinks significantly', () => {
    const { result } = renderHook(() => useViewportKeyboard());

    act(() => {
      simulateKeyboardOpen(300);
    });

    expect(result.current.isKeyboardOpen).toBe(true);
    expect(result.current.keyboardHeight).toBe(300);
    expect(result.current.visualViewportHeight).toBe(500);
  });

  it('detects keyboard closing when viewport returns to full height', () => {
    const { result } = renderHook(() => useViewportKeyboard());

    act(() => {
      simulateKeyboardOpen(300);
    });
    expect(result.current.isKeyboardOpen).toBe(true);

    act(() => {
      simulateKeyboardClose();
    });

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('does not report keyboard open for small viewport changes (toolbar)', () => {
    const { result } = renderHook(() => useViewportKeyboard());

    // Small change of 100px (less than 150px threshold)
    act(() => {
      simulateKeyboardOpen(100);
    });

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('reports correct keyboard height for various sizes', () => {
    const { result } = renderHook(() => useViewportKeyboard());

    act(() => {
      simulateKeyboardOpen(250);
    });
    expect(result.current.keyboardHeight).toBe(250);

    act(() => {
      simulateKeyboardOpen(350);
    });
    expect(result.current.keyboardHeight).toBe(350);
  });

  it('registers resize and scroll listeners on visual viewport', () => {
    renderHook(() => useViewportKeyboard());

    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
  });

  it('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useViewportKeyboard());

    unmount();

    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
  });

  it('auto-scrolls focused input into view when keyboard opens', () => {
    vi.useFakeTimers();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const scrollIntoViewMock = vi.fn();
    input.scrollIntoView = scrollIntoViewMock;

    const { result } = renderHook(() => useViewportKeyboard());

    act(() => {
      simulateKeyboardOpen(300);
    });

    // Advance past the 100ms delay
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });

    document.body.removeChild(input);
    vi.useRealTimers();
  });

  it('handles missing visualViewport gracefully', () => {
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: null,
    });

    const { result } = renderHook(() => useViewportKeyboard());

    // Should not crash and return default values
    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('does not scroll non-input elements', () => {
    vi.useFakeTimers();

    const div = document.createElement('div');
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();

    const scrollIntoViewMock = vi.fn();
    div.scrollIntoView = scrollIntoViewMock;

    renderHook(() => useViewportKeyboard());

    act(() => {
      simulateKeyboardOpen(300);
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    document.body.removeChild(div);
    vi.useRealTimers();
  });
});
