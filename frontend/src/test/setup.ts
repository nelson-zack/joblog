import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

vi.mock('react-chartjs-2', () => ({
  Bar: React.forwardRef<HTMLDivElement>((_props, ref) =>
    React.createElement('div', {
      ref,
      'data-testid': 'chart-mock',
      role: 'img',
      'aria-label': 'Chart placeholder'
    })
  )
}));

if (!(globalThis as any).indexedDB) {
  (globalThis as any).indexedDB = indexedDB;
  (globalThis as any).IDBKeyRange = IDBKeyRange;
}

if (!(globalThis as any).ResizeObserver) {
  class ResizeObserverMock {
    private callback: (entries: any[], observer: ResizeObserverMock) => void;

    constructor(callback: (entries: any[], observer: ResizeObserverMock) => void) {
      this.callback = callback;
    }

    observe(target: Element) {
      const rect = target.getBoundingClientRect
        ? target.getBoundingClientRect()
        : { width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0, x: 0, y: 0 };

      this.callback(
        [
          {
            contentRect: rect,
            target
          }
        ],
        this
      );
    }

    unobserve() {
      // no-op
    }

    disconnect() {
      // no-op
    }
  }

  (globalThis as any).ResizeObserver = ResizeObserverMock;
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
