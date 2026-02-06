import { describe, it, expect, vi } from 'vitest';
import {
  createSyncWorker,
  postSyncMessage,
  handleSyncResponse,
  type SyncWorkerMessage,
  type SyncWorkerResponse,
  type SyncWorkerStatus,
} from '@/lib/performance/sync-worker';

describe('sync-worker', () => {
  // -----------------------------------------------------------------------
  // createSyncWorker
  // -----------------------------------------------------------------------
  describe('createSyncWorker', () => {
    it('returns a worker-like object', () => {
      const worker = createSyncWorker();
      expect(worker).toBeDefined();
      expect(typeof worker.postMessage).toBe('function');
      expect(typeof worker.addEventListener).toBe('function');
      expect(typeof worker.removeEventListener).toBe('function');
      expect(typeof worker.terminate).toBe('function');
    });

    it('mock worker fires message events on postMessage', async () => {
      const worker = createSyncWorker();
      const listener = vi.fn();
      worker.addEventListener('message', listener);

      worker.postMessage({ type: 'status' });
      // The mock fires synchronously
      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as MessageEvent;
      expect(event.data.type).toBe('status');
    });

    it('terminate clears listeners', () => {
      const worker = createSyncWorker();
      const listener = vi.fn();
      worker.addEventListener('message', listener);
      worker.terminate();

      // After terminate, posting should not trigger the old listener
      worker.postMessage({ type: 'sync' });
      expect(listener).toHaveBeenCalledTimes(0);
    });

    it('removeEventListener stops delivery', () => {
      const worker = createSyncWorker();
      const listener = vi.fn();
      worker.addEventListener('message', listener);
      worker.removeEventListener('message', listener);

      worker.postMessage({ type: 'status' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // postSyncMessage
  // -----------------------------------------------------------------------
  describe('postSyncMessage', () => {
    it('calls worker.postMessage with the given message', () => {
      const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
      const msg: SyncWorkerMessage = { type: 'sync', payload: { ids: [1] } };

      postSyncMessage(mockWorker, msg);
      expect(mockWorker.postMessage).toHaveBeenCalledWith(msg);
    });

    it('sends a cancel message', () => {
      const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
      const msg: SyncWorkerMessage = { type: 'cancel' };

      postSyncMessage(mockWorker, msg);
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'cancel' });
    });

    it('sends a status message', () => {
      const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
      const msg: SyncWorkerMessage = { type: 'status' };

      postSyncMessage(mockWorker, msg);
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'status' });
    });
  });

  // -----------------------------------------------------------------------
  // handleSyncResponse
  // -----------------------------------------------------------------------
  describe('handleSyncResponse', () => {
    it('extracts a well-formed response', () => {
      const status: SyncWorkerStatus = {
        syncing: true,
        progress: 50,
        lastSync: '2025-01-01T00:00:00Z',
        errors: [],
      };
      const event = new MessageEvent('message', {
        data: { type: 'status', payload: status } as SyncWorkerResponse,
      });

      const result = handleSyncResponse(event);
      expect(result.type).toBe('status');
      expect(result.payload.syncing).toBe(true);
      expect(result.payload.progress).toBe(50);
    });

    it('handles missing payload fields with defaults', () => {
      const event = new MessageEvent('message', {
        data: { type: 'complete', payload: {} },
      });

      const result = handleSyncResponse(event);
      expect(result.payload.syncing).toBe(false);
      expect(result.payload.progress).toBe(0);
      expect(result.payload.lastSync).toBe('');
      expect(result.payload.errors).toEqual([]);
    });

    it('handles completely malformed data', () => {
      const event = new MessageEvent('message', { data: {} });

      const result = handleSyncResponse(event);
      expect(result.type).toBe('error');
      expect(result.payload.syncing).toBe(false);
    });

    it('preserves error strings from the worker', () => {
      const status: SyncWorkerStatus = {
        syncing: false,
        progress: 0,
        lastSync: '',
        errors: ['Timeout', 'Network failure'],
      };
      const event = new MessageEvent('message', {
        data: { type: 'error', payload: status } as SyncWorkerResponse,
      });

      const result = handleSyncResponse(event);
      expect(result.payload.errors).toEqual(['Timeout', 'Network failure']);
    });
  });
});
