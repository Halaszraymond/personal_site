/**
 * Unit tests for the Lighthouse gate: median per category and the ≥ 90 threshold
 * (README §5.4: hard gate of ≥ 90 in all four categories).
 */
import { describe, expect, it } from 'vitest';
import {
  failingCategories,
  median,
  medianScores,
  type CategoryScores,
} from '../../scripts/lib/lighthouse-scores';

const run = (performance: number, rest = 1): CategoryScores => ({
  performance,
  accessibility: rest,
  'best-practices': rest,
  seo: rest,
});

describe('median', () => {
  it('takes the middle value of an odd list, in any order', () => {
    expect(median([0.5, 0.9, 0.7])).toBe(0.7);
  });

  it('averages the two middle values of an even list', () => {
    expect(median([0.8, 0.9])).toBeCloseTo(0.85);
  });

  it('refuses an empty list', () => {
    expect(() => median([])).toThrow(/empty/);
  });
});

describe('medianScores', () => {
  it('takes the median per category over all runs', () => {
    expect(medianScores([run(0.95), run(0.7), run(0.92)])).toEqual(run(0.92));
  });

  it('is not fooled by one bad run', () => {
    expect(medianScores([run(0.99), run(0.2), run(0.98)]).performance).toBe(0.98);
  });
});

describe('failingCategories', () => {
  it('passes at exactly the threshold', () => {
    expect(failingCategories(run(0.9), 0.9)).toEqual([]);
  });

  it('lists every category under the threshold', () => {
    expect(failingCategories(run(0.89, 0.5), 0.9)).toEqual([
      'performance',
      'accessibility',
      'best-practices',
      'seo',
    ]);
  });
});
