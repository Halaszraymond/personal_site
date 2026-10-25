/**
 * Checks that the site's JavaScript stays within the budget (README §5.4).
 *
 * Run after `npm run build` with `npm run size`. Node 24 runs this `.ts` file directly
 * ("type stripping"), which is why the import below ends in `.ts`.
 *
 * Measures every `.js` file in `dist/` gzipped (as it travels over the network),
 * prints a table and exits with code 1 when the total is over the budget, which fails CI.
 * From Phase 1, the Three.js chunk gets its own budget next to this base one.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { checkBudget, formatKilobytes, KILOBYTE, type FileSize } from './lib/budgets.ts';

const DIST = 'dist';
/** Base budget for all JavaScript (README §5.4: base JS ≈ 50 KB). */
const BASE_BUDGET_BYTES = 50 * KILOBYTE;

/** All `.js` files under a folder, at any depth (like `glob('**\/*.js', recursive=True)`). */
function findJavaScriptFiles(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.js'))
    .map((path) => join(folder, path));
}

const files: FileSize[] = findJavaScriptFiles(DIST).map((path) => ({
  path: relative(DIST, path),
  // Level 9 = maximum compression, close to what Cloudflare serves.
  gzipBytes: gzipSync(readFileSync(path), { level: 9 }).length,
}));

const result = checkBudget(files, BASE_BUDGET_BYTES);

console.table(files.map((file) => ({ file: file.path, gzipped: formatKilobytes(file.gzipBytes) })));
console.log(
  `Total JavaScript: ${formatKilobytes(result.totalBytes)} of ${formatKilobytes(result.limitBytes)} budget`,
);

if (!result.withinBudget) {
  console.error('Over budget: the site ships more JavaScript than README §5.4 allows.');
  process.exit(1);
}
