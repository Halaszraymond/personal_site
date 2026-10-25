/**
 * Quality checks on every page in every language: no console errors and no accessibility
 * violations (README §5.4). Runs in all browser projects, with the production headers
 * from the fixture, so a CSP violation also shows up here as a console error.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const PAGES = ['/', '/nl/', '/hu/', '/en/', '/does-not-exist/'];

/** Collects JavaScript errors and console errors while the page loads. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const path of PAGES) {
  test(`${path} loads without console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    // Give module scripts time to run, so their errors are caught too.
    await page.waitForLoadState('networkidle');

    // On the 404 page, the browser logs the page's own 404 status as a failed load. Only that
    // one message is expected; anything else still fails the test.
    const isOwn404 = (error: string) =>
      path === '/does-not-exist/' && /Failed to load resource.*404/.test(error);
    expect(errors.filter((error) => !isOwn404(error))).toEqual([]);
  });

  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    // axe checks the page against WCAG 2.2 AA rules, the level the README asks for.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
