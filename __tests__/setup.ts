import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.matchMedia for components that use dark mode / responsive checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IndexedDB via idb
vi.mock('idb', () => {
  const stores: Record<string, Record<string, unknown>> = {};

  return {
    openDB: async () => ({
      get: async (store: string, key: string) => stores[store]?.[key],
      put: async (store: string, value: { id: string }) => {
        if (!stores[store]) stores[store] = {};
        stores[store][value.id] = value;
      },
      delete: async (store: string, key: string) => {
        delete stores[store]?.[key];
      },
      getAll: async (store: string) => Object.values(stores[store] || {}),
      getAllFromIndex: async (store: string) => Object.values(stores[store] || {}),
      clear: async (store: string) => {
        stores[store] = {};
      },
      transaction: () => ({
        objectStore: (name: string) => ({
          put: (value: { id: string }) => {
            if (!stores[name]) stores[name] = {};
            stores[name][value.id] = value;
          },
          delete: (key: string) => {
            delete stores[name]?.[key];
          },
        }),
        done: Promise.resolve(),
      }),
    }),
  };
});
