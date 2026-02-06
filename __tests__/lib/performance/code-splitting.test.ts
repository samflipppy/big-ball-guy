import { describe, it, expect, vi } from 'vitest';
import {
  lazyComponent,
  preloadComponent,
  ROUTE_CHUNKS,
  measureChunkSize,
  getLoadPriority,
} from '@/lib/performance/code-splitting';

describe('code-splitting', () => {
  // -----------------------------------------------------------------------
  // ROUTE_CHUNKS
  // -----------------------------------------------------------------------
  describe('ROUTE_CHUNKS', () => {
    it('contains entries for the main routes', () => {
      const routes = ROUTE_CHUNKS.map((c) => c.route);
      expect(routes).toContain('/');
      expect(routes).toContain('/playbook');
      expect(routes).toContain('/sketch');
      expect(routes).toContain('/settings');
    });

    it('each entry has route, chunkName, and priority', () => {
      for (const chunk of ROUTE_CHUNKS) {
        expect(chunk.route).toBeTruthy();
        expect(chunk.chunkName).toBeTruthy();
        expect(['eager', 'lazy', 'prefetch']).toContain(chunk.priority);
      }
    });
  });

  // -----------------------------------------------------------------------
  // lazyComponent
  // -----------------------------------------------------------------------
  describe('lazyComponent', () => {
    it('starts with component=null and loading=false', () => {
      const lazy = lazyComponent(() => Promise.resolve({ default: 'comp' }));
      expect(lazy.component).toBeNull();
      expect(lazy.loading).toBe(false);
      expect(lazy.error).toBeNull();
    });

    it('resolves the component after load()', async () => {
      const lazy = lazyComponent(() => Promise.resolve({ default: 'MyComp' }));
      const result = await lazy.load();

      expect(result).toBe('MyComp');
      expect(lazy.component).toBe('MyComp');
      expect(lazy.loading).toBe(false);
    });

    it('captures errors on failed loads', async () => {
      const lazy = lazyComponent(() =>
        Promise.reject(new Error('Network error')),
      );

      await expect(lazy.load()).rejects.toThrow('Network error');
      expect(lazy.error).toBeInstanceOf(Error);
      expect(lazy.error!.message).toBe('Network error');
      expect(lazy.loading).toBe(false);
    });

    it('sets loading=true during the load', async () => {
      let resolve!: (v: { default: string }) => void;
      const promise = new Promise<{ default: string }>((r) => {
        resolve = r;
      });
      const lazy = lazyComponent(() => promise);

      const loadPromise = lazy.load();
      expect(lazy.loading).toBe(true);

      resolve({ default: 'Done' });
      await loadPromise;
      expect(lazy.loading).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // preloadComponent
  // -----------------------------------------------------------------------
  describe('preloadComponent', () => {
    it('returns the default export', async () => {
      const result = await preloadComponent(() =>
        Promise.resolve({ default: 'Preloaded' }),
      );
      expect(result).toBe('Preloaded');
    });

    it('triggers the import function exactly once', async () => {
      const importFn = vi.fn().mockResolvedValue({ default: 'X' });
      await preloadComponent(importFn);
      expect(importFn).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // measureChunkSize
  // -----------------------------------------------------------------------
  describe('measureChunkSize', () => {
    it('returns known chunk sizes', () => {
      expect(measureChunkSize('home')).toBe(45_000);
      expect(measureChunkSize('sketch')).toBe(180_000);
    });

    it('returns 0 for unknown chunks', () => {
      expect(measureChunkSize('nonexistent')).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getLoadPriority
  // -----------------------------------------------------------------------
  describe('getLoadPriority', () => {
    it('returns "eager" for the home route', () => {
      expect(getLoadPriority('/')).toBe('eager');
    });

    it('returns "prefetch" for gameplan', () => {
      expect(getLoadPriority('/gameplan')).toBe('prefetch');
    });

    it('returns "lazy" for settings', () => {
      expect(getLoadPriority('/settings')).toBe('lazy');
    });

    it('defaults to "lazy" for unknown routes', () => {
      expect(getLoadPriority('/unknown-page')).toBe('lazy');
    });
  });
});
