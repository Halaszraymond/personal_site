/**
 * The bundle-size budget: does the JavaScript a visitor downloads stay under the limit?
 *
 * Pure logic (sizes in, verdict out), unit-tested. The runner script
 * `scripts/check-bundle-size.ts` measures the files and prints the result.
 */

/** 1 KB = 1024 bytes, the way browsers and build tools report sizes. */
export const KILOBYTE = 1024;

/** One JavaScript file and its size after gzip compression, which is what travels over the network. */
export interface FileSize {
  path: string;
  gzipBytes: number;
}

/** The verdict for one budget. */
export interface BudgetResult {
  totalBytes: number;
  limitBytes: number;
  withinBudget: boolean;
}

/** Adds up the files and compares the total with the limit. Exactly at the limit still passes. */
export function checkBudget(files: readonly FileSize[], limitBytes: number): BudgetResult {
  // `reduce` folds a list into one value, like `sum(f.gzip_bytes for f in files)` in Python.
  const totalBytes = files.reduce((sum, file) => sum + file.gzipBytes, 0);
  return { totalBytes, limitBytes, withinBudget: totalBytes <= limitBytes };
}

/** Formats bytes as kilobytes with one decimal, e.g. `1.5 KB`. */
export function formatKilobytes(bytes: number): string {
  return `${(bytes / KILOBYTE).toFixed(1)} KB`;
}
