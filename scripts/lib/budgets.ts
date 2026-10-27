/**
 * The bundle-size budgets: does the JavaScript each page loads stay under its limit?
 *
 * Budgets are per page, because pages load different code (later: the animated pages load
 * GSAP, the others don't). A page's JavaScript is the scripts its HTML loads plus
 * everything those scripts import, followed through the chunks.
 *
 * Pure logic (texts and sizes in, verdicts out), unit-tested. The runner script
 * `scripts/check-bundle-size.ts` reads the build and prints the result.
 */
import { posix } from 'node:path';

/** 1 KB = 1024 bytes, the way browsers and build tools report sizes. */
export const KILOBYTE = 1024;

/** Every public page (README Â§5.4: base JS â‰ˆ 50 KB). */
export const BASE_BUDGET_BYTES = 50 * KILOBYTE;

/**
 * Pages with their own budget, by page path. Empty for now: every page, the dev-only preview
 * included, gets the base budget. GSAP's budget joins here in the animations change, once it
 * is measured (kalman-rig design §8). A `Map` is like a Python `dict`.
 */
export const PAGE_BUDGETS: ReadonlyMap<string, number> = new Map();

/** The budget for a page path such as `/`, `/nl/` or `/playground/`. */
export function budgetFor(pagePath: string): number {
  return PAGE_BUDGETS.get(pagePath) ?? BASE_BUDGET_BYTES;
}

/** The site path of a built HTML file: `nl/index.html` â†’ `/nl/`, `404.html` â†’ `/404.html`. */
export function pagePathOf(htmlFile: string): string {
  const path = `/${htmlFile.replaceAll('\\', '/')}`;
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
}

/** The `src` of every `<script â€¦ src="â€¦">` in an HTML page, e.g. `/_astro/BaseLayout.abc.js`. */
export function scriptsInHtml(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1] ?? '');
}

/**
 * The files a JavaScript chunk imports, as written in its code: `./other.js`.
 * Covers `import â€¦ from"./x.js"`, side-effect `import"./x.js"` and lazy `import("./x.js")`
 * (counted too: a page that loads it later still downloads it).
 */
export function importsInChunk(code: string): string[] {
  const pattern = /(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+\.js)["']/g;
  return [...code.matchAll(pattern)].map((match) => match[1] ?? '');
}

/**
 * Every chunk a page loads: its entry scripts plus everything they import, directly or
 * via other chunks. A breadth-first walk through the import graph, each chunk counted once
 * (like walking a dependency tree with a `seen` set in Python).
 */
export function reachableChunks(
  entries: readonly string[],
  importsOf: (chunk: string) => readonly string[],
): string[] {
  const seen = new Set<string>(entries);
  const queue = [...entries];
  while (queue.length > 0) {
    const chunk = queue.shift() ?? '';
    for (const specifier of importsOf(chunk)) {
      const resolved = posix.join(posix.dirname(chunk), specifier);
      if (!seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }
  return [...seen];
}

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
