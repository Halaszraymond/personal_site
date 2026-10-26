/**
 * End-to-end tests for the render-mode switch (spec: render-fallback).
 *
 * The two signals are set per test: reduced motion through Playwright's media emulation,
 * Save-Data through an init script (code that runs before the page's own scripts).
 * That makes the tests deterministic in every browser.
 */
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Pretends the browser reports Save-Data, as Chromium does when "Lite mode" is on. */
async function stubSaveData(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
  });
}

/** Removes `navigator.connection`, as in Firefox and Safari. */
async function removeConnectionInfo(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: undefined });
  });
}

/** Collects JavaScript errors and console errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

const html = (page: Page) => page.locator('html');

test('a capable browser switches to full mode with the scene slot', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'full');
  await expect(page.locator('[data-scene-slot]')).toHaveAttribute('aria-hidden', 'true');
  expect(errors).toEqual([]);
});

test('Save-Data keeps the fallback', async ({ page }) => {
  await stubSaveData(page);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'fallback');
});

test('a browser without the Save-Data setting still gets full mode', async ({ page }) => {
  await removeConnectionInfo(page);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'full');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the fallback', async ({ page }) => {
    await page.goto('/en/');

    await expect(html(page)).toHaveAttribute('data-render-mode', 'fallback');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page is in fallback mode with all content visible', async ({ page }) => {
    await page.goto('/en/');

    await expect(html(page)).toHaveAttribute('data-render-mode', 'fallback');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Language' })).toBeVisible();
  });
});

/** The page's visible text and link targets: what must be identical in both modes. */
async function contentOf(page: Page) {
  return {
    text: await page.locator('body').innerText(),
    links: await page.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href'))),
  };
}

for (const path of ['/', '/nl/', '/hu/', '/en/']) {
  // Two pages in the test's own context, so both get the production headers from the fixture.
  test(`${path} has the same text and links in both modes`, async ({ context }) => {
    const fallbackPage = await context.newPage();
    await fallbackPage.emulateMedia({ reducedMotion: 'reduce' });
    await fallbackPage.goto(path);
    await expect(html(fallbackPage)).toHaveAttribute('data-render-mode', 'fallback');

    const fullPage = await context.newPage();
    await fullPage.goto(path);
    await expect(html(fullPage)).toHaveAttribute('data-render-mode', 'full');

    expect(await contentOf(fullPage)).toEqual(await contentOf(fallbackPage));
    await fallbackPage.close();
    await fullPage.close();
  });
}
