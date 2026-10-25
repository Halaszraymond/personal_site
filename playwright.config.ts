/**
 * Playwright configuration: end-to-end tests in real browsers.
 *
 * The tests run against the *built* site (`npm run preview` serves `dist/`), not the
 * dev server, so they see exactly what Cloudflare Pages will serve.
 * Run `npm run build` first; `npm run check` does both in the right order.
 */
import { defineConfig, devices } from '@playwright/test';

// `process.env['CI']` is set by GitHub Actions. Bracket access because env keys are
// arbitrary strings (TypeScript's `strictest` asks for that, like `os.environ['CI']`).
const isCI = process.env['CI'] !== undefined;

/** The visual regression tests (screenshots), kept apart from the functional tests. */
const VISUAL = /visual\.spec\.ts/;

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // A leftover `test.only` would silently skip every other test; in CI that is an error.
  forbidOnly: isCI,
  // No retries: a test that only passes on the second try points at a real problem.
  retries: 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    // Locally, reuse a preview server you already have running.
    reuseExistingServer: !isCI,
    // Astro's anonymous usage report can hang for ~40 s on a filtered (work) network.
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
  },
  // Baselines without the platform in their name (Playwright's default adds `-win32` or
  // `-linux`): they are only ever made and compared on Linux, so one set is enough.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  // Every functional test runs in four browsers: desktop and mobile Chromium (Chrome, Edge),
  // mobile WebKit (the engine of every iPhone browser) and desktop Firefox.
  // The visual tests run in one browser only, so there is one baseline per screenshot.
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: VISUAL },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testIgnore: VISUAL },
    { name: 'mobile-webkit', use: { ...devices['iPhone 15'] }, testIgnore: VISUAL },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: VISUAL },
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: VISUAL },
  ],
});
