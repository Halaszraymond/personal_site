/**
 * Checks that the JavaScript each page loads stays within its budget (README §5.4).
 *
 * Run after a build with `npm run size`. Node 24 runs this `.ts` file directly
 * ("type stripping"), which is why the import below ends in `.ts`.
 *
 * For every HTML page in `dist/`: take the scripts it loads, follow their imports through
 * the chunks, add up the gzipped sizes (what travels over the network), and compare with
 * the page's budget (50 KB for every page for now; see `budgetFor()`).
 * Prints a table and exits with code 1 when any page is over, which fails CI.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  budgetFor,
  checkBudget,
  formatKilobytes,
  importsInChunk,
  pagePathOf,
  reachableChunks,
  scriptsInHtml,
} from './lib/budgets.ts';

const DIST = 'dist';

/** The text of a built file, by its site path (`/_astro/x.js` → `dist/_astro/x.js`). */
function readSiteFile(sitePath: string): string {
  return readFileSync(join(DIST, sitePath), 'utf8');
}

/** Gzipped sizes, measured once per chunk even when many pages load it. */
const gzipCache = new Map<string, number>();
function gzippedSize(chunk: string): number {
  const cached = gzipCache.get(chunk);
  if (cached !== undefined) return cached;
  // Level 9 = maximum compression, close to what Cloudflare serves.
  const size = gzipSync(readSiteFile(chunk), { level: 9 }).length;
  gzipCache.set(chunk, size);
  return size;
}

const htmlFiles = readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((path) =>
  path.endsWith('.html'),
);

const rows: Record<string, string>[] = [];
const overBudget: string[] = [];

for (const htmlFile of htmlFiles) {
  const page = pagePathOf(htmlFile);
  const entries = scriptsInHtml(readFileSync(join(DIST, htmlFile), 'utf8'));
  const chunks = reachableChunks(entries, (chunk) => importsInChunk(readSiteFile(chunk)));
  const result = checkBudget(
    chunks.map((chunk) => ({ path: chunk, gzipBytes: gzippedSize(chunk) })),
    budgetFor(page),
  );
  rows.push({
    page,
    chunks: String(chunks.length),
    javascript: formatKilobytes(result.totalBytes),
    budget: formatKilobytes(result.limitBytes),
    verdict: result.withinBudget ? 'ok' : 'OVER',
  });
  if (!result.withinBudget) overBudget.push(page);
}

console.table(rows);
if (overBudget.length > 0) {
  console.error(`Over budget: ${overBudget.join(', ')} (README §5.4).`);
  process.exit(1);
}
console.log('Every page is within its JavaScript budget.');
