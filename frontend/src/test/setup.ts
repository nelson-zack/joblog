import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

if (!(globalThis as any).indexedDB) {
  (globalThis as any).indexedDB = indexedDB;
  (globalThis as any).IDBKeyRange = IDBKeyRange;
}

beforeAll(() => {
  if (!navigator.sendBeacon) {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: vi.fn(() => true),
      configurable: true,
      writable: true
    });
  } else {
    vi.spyOn(navigator, 'sendBeacon').mockReturnValue(true);
  }
});

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
