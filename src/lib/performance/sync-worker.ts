/**
 * Web Worker for Background Sync (#230)
 *
 * Provides typed message helpers and a factory for the sync web worker
 * that processes the IndexedDB pending-sync queue in the background.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncWorkerMessage {
  type: 'sync' | 'status' | 'cancel';
  payload?: unknown;
}

export interface SyncWorkerStatus {
  syncing: boolean;
  progress: number;
  lastSync: string;
  errors: string[];
}

export interface SyncWorkerResponse {
  type: 'status' | 'complete' | 'error';
  payload: SyncWorkerStatus;
}

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

/**
 * Create a Web Worker instance for background sync.
 * Falls back to a lightweight mock when `Worker` is unavailable
 * (e.g., SSR or test environments).
 */
export function createSyncWorker(): Worker {
  if (typeof Worker !== 'undefined') {
    try {
      return new Worker(new URL('./sync-worker-script.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      // Fall through to mock
    }
  }

  // Minimal mock that satisfies the Worker interface enough for tests
  const listeners: Record<string, EventListener[]> = {};
  const mock = {
    postMessage: (_msg: unknown) => {
      // Fire a synthetic 'message' event so callers see a response
      const status: SyncWorkerStatus = {
        syncing: false,
        progress: 0,
        lastSync: new Date().toISOString(),
        errors: [],
      };
      const event = new MessageEvent('message', {
        data: { type: 'status', payload: status } as SyncWorkerResponse,
      });
      (listeners['message'] ?? []).forEach((fn) => fn(event));
    },
    addEventListener: (type: string, fn: EventListener) => {
      listeners[type] = listeners[type] ?? [];
      listeners[type].push(fn);
    },
    removeEventListener: (type: string, fn: EventListener) => {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
    terminate: () => {
      Object.keys(listeners).forEach((k) => delete listeners[k]);
    },
    onmessage: null as ((ev: MessageEvent) => void) | null,
    onmessageerror: null as ((ev: MessageEvent) => void) | null,
    onerror: null as ((ev: ErrorEvent) => void) | null,
    dispatchEvent: (_e: Event) => true,
  } as unknown as Worker;

  return mock;
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * Type-safe wrapper around `worker.postMessage` that ensures the payload
 * conforms to `SyncWorkerMessage`.
 */
export function postSyncMessage(
  worker: Worker,
  message: SyncWorkerMessage,
): void {
  worker.postMessage(message);
}

/**
 * Process a MessageEvent returned by the sync worker and extract the
 * typed `SyncWorkerResponse`.
 */
export function handleSyncResponse(event: MessageEvent): SyncWorkerResponse {
  const data = event.data as SyncWorkerResponse;

  return {
    type: data.type ?? 'error',
    payload: {
      syncing: data.payload?.syncing ?? false,
      progress: data.payload?.progress ?? 0,
      lastSync: data.payload?.lastSync ?? '',
      errors: data.payload?.errors ?? [],
    },
  };
}
