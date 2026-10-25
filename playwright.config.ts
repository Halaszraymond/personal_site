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
  },
  projects: [{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }],
});
