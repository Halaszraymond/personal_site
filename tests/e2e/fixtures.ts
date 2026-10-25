/**
 * The shared `test` for all e2e tests: Playwright's own, plus the production headers.
 *
 * Astro's preview server ignores `public/_headers`, but Cloudflare Pages applies it.
 * Without this fixture, a CSP that blocks our own scripts in production would pass
 * every test. So every response in every test gets the headers from `_headers`.
 *
 * A fixture is setup code Playwright runs around each test (like a pytest fixture);
 * `auto: true` means every test gets it without asking for it.
 */
import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { parseHeadersFile } from '../../scripts/lib/headers-file';

const rules = parseHeadersFile(readFileSync('public/_headers', 'utf8'));

// Phase 0 only has the catch-all rule `/*`. Path-specific rules need matching logic here;
// fail loudly instead of silently ignoring them.
if (rules.length !== 1 || rules[0]?.pattern !== '/*') {
  throw new Error('tests/e2e/fixtures.ts only supports a single `/*` rule in public/_headers.');
}
const productionHeaders = rules[0].headers;

/** True for the errors Playwright gives when a request was cancelled by a navigation or close. */
function isCancelledRequest(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /has been disposed|has been closed|Route is already handled/.test(message);
}

// The fixture gives the test no value (`undefined`); it only sets up the routing.
export const test = base.extend<{ productionHeaders: undefined }>({
  productionHeaders: [
    async ({ context }, use) => {
      // Intercept every response in this browser context and add the production headers.
      await context.route('**/*', async (route) => {
        try {
          const response = await route.fetch();
          await route.fulfill({
            response,
            headers: { ...response.headers(), ...productionHeaders },
          });
        } catch (error) {
          // When a test navigates away while a request of the previous page is still in
          // flight, the browser cancels it. That is normal; any other error is re-thrown.
          if (!isCancelledRequest(error)) throw error;
        }
      });
      await use(undefined);
    },
    { auto: true },
  ],
});

export { expect };
