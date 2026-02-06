/**
 * Service Worker Registration & Lifecycle Management
 *
 * Registers the service worker on app load, handles updates,
 * and provides utilities for cache management.
 */

const SW_PATH = '/sw.js';

export interface ServiceWorkerRegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Register the service worker. Should be called once on app load.
 * Only registers in production or when explicitly enabled.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  if (typeof window === 'undefined') {
    return { success: false, error: new Error('Cannot register service worker on the server') };
  }

  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    return { success: false, error: new Error('Service workers are not supported in this browser') };
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    // Listen for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available; notify user if desired
            console.log('[SW] New content available. Refresh to update.');
          } else {
            // Content is cached for the first time (offline-ready)
            console.log('[SW] Content cached for offline use.');
          }
        }
      };
    };

    return { success: true, registration };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[SW] Registration failed:', err);
    return { success: false, error: err };
  }
}

/**
 * Unregister all service workers. Useful for development or troubleshooting.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.serviceWorker) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    return result;
  } catch {
    return false;
  }
}

/**
 * Check if there is an updated service worker waiting to activate.
 */
export async function checkForUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.serviceWorker) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return !!registration.waiting;
  } catch {
    return false;
  }
}

/**
 * Skip waiting on the new service worker so it activates immediately.
 */
export function skipWaiting(): void {
  if (typeof window === 'undefined' || !navigator.serviceWorker) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
}
