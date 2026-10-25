/**
 * The Lighthouse gate (README §5.4): every page must score ≥ 90 in performance,
 * accessibility, best practices and SEO, on a simulated mid-range phone.
 *
 * Run after `npm run build` with `npm run lighthouse`. Steps:
 *   1. start Astro's preview server on the built `dist/`;
 *   2. run Lighthouse 5 times per page, taking turns between pages (its default is mobile emulation);
 *   3. take the median per category and fail (exit code 1) below the threshold.
 * The full reports land in `.lighthouse/` as HTML (open in a browser) and JSON.
 *
 * Lighthouse needs Chrome. It finds an installed Chrome by itself; otherwise set
 * CHROME_PATH (see docs/architecture.md).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  CATEGORIES,
  failingCategories,
  medianScores,
  type CategoryScores,
} from './lib/lighthouse-scores.ts';

const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;
const PAGES = ['/', '/nl/', '/hu/', '/en/'];
/** Odd, so the median is a real run. 5 rather than 3: then 3 noisy runs are needed to tip it. */
const RUNS_PER_PAGE = 5;
const THRESHOLD = 0.9;
const REPORT_DIR = '.lighthouse';
const SERVER_START_TIMEOUT_MS = 30_000;

/** The part of Lighthouse's JSON report we read. */
interface LighthouseReport {
  categories: Record<string, { score: number | null } | undefined>;
}

/**
 * Starts `astro preview`. We start Node itself with Astro's script (instead of `npx astro`),
 * so `kill()` stops the server directly, also on Windows.
 * Telemetry off: Astro's anonymous usage report can hang for ~40 s on a filtered network.
 */
function startPreviewServer(): ChildProcess {
  return spawn(
    process.execPath,
    ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT)],
    { stdio: 'ignore', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } },
  );
}

/** Waits until the server answers, checking every half second. */
async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not listening yet: try again shortly.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The preview server did not start within ${SERVER_START_TIMEOUT_MS / 1000} s.`);
}

/** Runs Lighthouse once and writes `<outputPath>.report.json` and `.report.html`. */
function runLighthouse(url: string, outputPath: string): Promise<void> {
  const args = [
    'node_modules/lighthouse/cli/index.js',
    url,
    '--quiet',
    '--output=json',
    '--output=html',
    `--output-path=${outputPath}`,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--chrome-flags=--headless=new',
  ];
  // A Promise wraps "wait until the process exits", a bit like awaiting subprocess.run().
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse exited with code ${String(code)} for ${url}`));
    });
  });
}

/** Reads the four category scores from a JSON report. */
function readScores(jsonPath: string): CategoryScores {
  const report = JSON.parse(readFileSync(jsonPath, 'utf8')) as LighthouseReport;
  const scoreOf = (category: string): number => {
    const score = report.categories[category]?.score;
    // Lighthouse gives `null` when a category could not be measured: treat that as a failure.
    if (score === null || score === undefined) {
      throw new Error(`No ${category} score in ${jsonPath}`);
    }
    return score;
  };
  return {
    performance: scoreOf('performance'),
    accessibility: scoreOf('accessibility'),
    'best-practices': scoreOf('best-practices'),
    seo: scoreOf('seo'),
  };
}

/** A file-friendly name for a page: `/` → `root`, `/nl/` → `nl`. */
function reportName(path: string): string {
  return path === '/' ? 'root' : path.replaceAll('/', '');
}

async function main(): Promise<void> {
  rmSync(REPORT_DIR, { recursive: true, force: true });
  mkdirSync(REPORT_DIR);

  const server = startPreviewServer();
  const rows: Record<string, string | number>[] = [];
  const failures: string[] = [];

  try {
    await waitForServer(BASE_URL);

    // Round-robin: run 1 of every page, then run 2 of every page, and so on. Background load
    // on the machine comes in bursts; this spreads a burst over all pages instead of letting
    // it spoil several runs of the same page. Like a dict of lists in Python: {path: [scores]}.
    const runsPerPage = new Map<string, CategoryScores[]>(PAGES.map((path) => [path, []]));
    for (let run = 1; run <= RUNS_PER_PAGE; run++) {
      for (const path of PAGES) {
        const outputPath = join(REPORT_DIR, `${reportName(path)}-${run}`);
        await runLighthouse(BASE_URL + path, outputPath);
        runsPerPage.get(path)?.push(readScores(`${outputPath}.report.json`));
      }
    }

    for (const path of PAGES) {
      const scores = medianScores(runsPerPage.get(path) ?? []);
      rows.push({ page: path, ...toPercentages(scores) });
      for (const category of failingCategories(scores, THRESHOLD)) {
        failures.push(`${path}: ${category} ${Math.round(scores[category] * 100)}`);
      }
    }
  } finally {
    // Always stop the server, also when something above failed.
    server.kill();
  }

  console.table(rows);
  if (failures.length > 0) {
    console.error(`Below ${THRESHOLD * 100}:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`All pages score at least ${THRESHOLD * 100} in every category.`);
}

/** Scores as whole percentages, the way Lighthouse shows them. */
function toPercentages(scores: CategoryScores): Record<string, number> {
  return Object.fromEntries(
    CATEGORIES.map((category) => [category, Math.round(scores[category] * 100)]),
  );
}

await main();
