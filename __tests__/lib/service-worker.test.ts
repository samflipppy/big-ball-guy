import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdate,
  skipWaiting,
} from '@/lib/service-worker';

describe('Service Worker Registration', () => {
  const mockRegistration: Partial<ServiceWorkerRegistration> = {
    installing: null,
    waiting: null,
    active: null,
    scope: '/',
    onupdatefound: null,
    update: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  beforeEach(() => {
    // Set up serviceWorker mock on navigator
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
        controller: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerServiceWorker', () => {
    it('registers the service worker at /sw.js with scope /', async () => {
      const result = await registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
      expect(result.success).toBe(true);
      expect(result.registration).toBeDefined();
    });

    it('returns error when serviceWorker is not supported', async () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const result = await registerServiceWorker();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not supported');
    });

    it('returns error when registration fails', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockRejectedValue(new Error('Registration failed')),
          ready: Promise.resolve(mockRegistration),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const result = await registerServiceWorker();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Registration failed');
    });

    it('sets up an onupdatefound handler on the registration', async () => {
      const result = await registerServiceWorker();

      expect(result.success).toBe(true);
      expect(result.registration?.onupdatefound).toBeTypeOf('function');
    });
  });

  describe('unregisterServiceWorker', () => {
    it('calls unregister on the active registration', async () => {
      const result = await unregisterServiceWorker();

      expect(mockRegistration.unregister).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false when serviceWorker is not available', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });
  });

  describe('checkForUpdate', () => {
    it('calls update on the registration', async () => {
      await checkForUpdate();

      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it('returns true when a waiting worker exists', async () => {
      const regWithWaiting = {
        ...mockRegistration,
        waiting: { postMessage: vi.fn() } as unknown as ServiceWorker,
      };
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue(regWithWaiting),
          ready: Promise.resolve(regWithWaiting),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const result = await checkForUpdate();
      expect(result).toBe(true);
    });

    it('returns false when no waiting worker exists', async () => {
      const result = await checkForUpdate();
      expect(result).toBe(false);
    });

    it('returns false when serviceWorker is not available', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const result = await checkForUpdate();
      expect(result).toBe(false);
    });
  });

  describe('skipWaiting', () => {
    it('sends SKIP_WAITING message to the waiting worker', async () => {
      const postMessageMock = vi.fn();
      const regWithWaiting = {
        ...mockRegistration,
        waiting: { postMessage: postMessageMock } as unknown as ServiceWorker,
      };
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue(regWithWaiting),
          ready: Promise.resolve(regWithWaiting),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      skipWaiting();

      // Need to wait for the promise chain to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(postMessageMock).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('does not throw when serviceWorker is not available', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      expect(() => skipWaiting()).not.toThrow();
    });
  });
});
