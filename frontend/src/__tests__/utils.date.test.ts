import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { normalizeYMD, parseYMDToUTC, todayYMDLocal } from '../utils/date.js';

describe('date utils', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-15T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('normalizes loose date strings', () => {
    expect(normalizeYMD('2025-5-9')).toEqual('2025-05-09');
    expect(normalizeYMD('2025-02-31')).toEqual('');
    expect(normalizeYMD('')).toEqual('');
  });

  it('formats today in local timezone', () => {
    expect(todayYMDLocal()).toEqual('2025-05-15');
  });

  it('parses strict dates to UTC epoch', () => {
    const ts = parseYMDToUTC('2025-05-15');
    expect(ts).toBeGreaterThan(0);
    expect(parseYMDToUTC('2024-02-31')).toEqual(0);
  });
});
