import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

// ---------------------------------------------------------------------------
// Mocks and helpers
// ---------------------------------------------------------------------------

const DISMISS_KEY = 'bbg_install_dismissed_at';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  });
}

beforeEach(() => {
  localStorage.clear();
  mockMatchMedia(false); // not standalone
  // Reset navigator.userAgent to non-iOS
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInstallPrompt', () => {
  it('initializes with canInstall false', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('initializes with isInstalled false when not standalone', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstalled).toBe(false);
  });

  it('sets canInstall true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as Event & { preventDefault: () => void }).preventDefault = vi.fn();
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('sets isInstalled true when appinstalled fires', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('dismiss stores timestamp in localStorage', () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull();
  });

  it('reads dismissal from localStorage on mount', () => {
    // Set a recent dismiss time
    localStorage.setItem(DISMISS_KEY, String(Date.now()));

    const { result } = renderHook(() => useInstallPrompt());
    // Need to wait for the useEffect
    expect(result.current.isDismissed).toBe(true);
  });

  it('does not consider old dismissals as dismissed', () => {
    // Set a dismiss time older than 7 days
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(eightDaysAgo));

    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isDismissed).toBe(false);
  });

  it('detects iOS user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isIOS).toBe(true);
  });

  it('detects non-iOS user agent', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isIOS).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useInstallPrompt());

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain('beforeinstallprompt');
    expect(removedEvents).toContain('appinstalled');
  });

  it('promptInstall is a no-op when no deferred prompt exists', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    // Should not throw
    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.canInstall).toBe(false);
  });
});
