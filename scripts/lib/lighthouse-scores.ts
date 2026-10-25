/**
 * The Lighthouse gate: turns the scores of several runs into one verdict.
 *
 * Lighthouse scores vary a little between runs (timing noise), so each page is measured
 * several times and the *median* counts: one unlucky run can't fail the build, and one
 * lucky run can't pass it. Pure logic, unit-tested; `scripts/run-lighthouse.ts` runs
 * Lighthouse and feeds the scores in.
 */

/** The four categories we gate on (README §5.4). */
export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
export type Category = (typeof CATEGORIES)[number];

/** One run's score per category, from 0 to 1 (Lighthouse shows them ×100). */
export type CategoryScores = Record<Category, number>;

/** The middle value of a list, like `statistics.median()` in Python. */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot take the median of an empty list.');
  }
  // Copy before sorting: `sort` changes the list in place, like `list.sort()` in Python.
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  // `?? 0` only satisfies the type checker: the index is always within the list here.
  const upper = sorted[middle] ?? 0;
  if (sorted.length % 2 === 1) {
    return upper;
  }
  const lower = sorted[middle - 1] ?? 0;
  return (lower + upper) / 2;
}

/** The median per category over several runs of the same page. */
export function medianScores(runs: readonly CategoryScores[]): CategoryScores {
  // Builds `{ performance: median(...), accessibility: median(...), ... }`, like a dict
  // comprehension in Python. `Object.fromEntries` turns [key, value] pairs into an object.
  return Object.fromEntries(
    CATEGORIES.map((category) => [category, median(runs.map((scores) => scores[category]))]),
  ) as CategoryScores;
}

/** The categories scoring below the threshold. Exactly at the threshold passes. */
export function failingCategories(scores: CategoryScores, threshold: number): Category[] {
  return CATEGORIES.filter((category) => scores[category] < threshold);
}
