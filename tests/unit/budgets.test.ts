/**
 * Unit tests for the bundle-size budget (README §5.4: performance budgets are enforced).
 */
import { describe, expect, it } from 'vitest';
import { checkBudget, formatKilobytes, KILOBYTE } from '../../scripts/lib/budgets';

const LIMIT = 50 * KILOBYTE;

describe('checkBudget', () => {
  it('passes under the budget and adds up all files', () => {
    const result = checkBudget(
      [
        { path: 'a.js', gzipBytes: 10 * KILOBYTE },
        { path: 'b.js', gzipBytes: 5 * KILOBYTE },
      ],
      LIMIT,
    );
    expect(result).toEqual({ totalBytes: 15 * KILOBYTE, limitBytes: LIMIT, withinBudget: true });
  });

  it('passes exactly at the budget', () => {
    expect(checkBudget([{ path: 'a.js', gzipBytes: LIMIT }], LIMIT).withinBudget).toBe(true);
  });

  it('fails one byte over the budget', () => {
    expect(checkBudget([{ path: 'a.js', gzipBytes: LIMIT + 1 }], LIMIT).withinBudget).toBe(false);
  });

  it('passes with no files at all', () => {
    expect(checkBudget([], LIMIT)).toEqual({
      totalBytes: 0,
      limitBytes: LIMIT,
      withinBudget: true,
    });
  });
});

describe('formatKilobytes', () => {
  it('shows kilobytes with one decimal', () => {
    expect(formatKilobytes(1536)).toBe('1.5 KB');
    expect(formatKilobytes(0)).toBe('0.0 KB');
  });
});
