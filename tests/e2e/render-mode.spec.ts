/**
 * End-to-end tests for the render-mode switch (spec: render-fallback).
 *
 * Headless browsers in CI may or may not have WebGL2, so every test decides it itself:
 * an init script (code that runs before the page's own scripts) replaces
 * `canvas.getContext('webgl2')` with a stub. That makes the tests deterministic.
 * Real WebGL rendering is tested once there is a scene (Phase 1).
 */
import { expect, test, type Page } from '@playwright/test';

/** Makes `getContext('webgl2')` return a fake context (`true`) or nothing (`false`). */
async function stubWebGL2(page: Page, available: boolean) {
  await page.addInitScript((webgl2Available) => {
    const original = HTMLCanvasElement.prototype.getContext;
    // Replace the method on every canvas; other context types still use the original.
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === 'webgl2') {
        return webgl2Available ? { getExtension: () => null } : null;
      }
      return original.call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  }, available);
}

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
  await stubWebGL2(page, true);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'full');
  await expect(page.locator('[data-scene-slot]')).toHaveAttribute('aria-hidden', 'true');
});

test('a browser without WebGL2 stays in fallback mode without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await stubWebGL2(page, false);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'fallback');
  expect(errors).toEqual([]);
});

test('Save-Data keeps the fallback', async ({ page }) => {
  await stubWebGL2(page, true);
  await stubSaveData(page);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'fallback');
});

test('a browser without the Save-Data setting still gets full mode', async ({ page }) => {
  await stubWebGL2(page, true);
  await removeConnectionInfo(page);
  await page.goto('/en/');

  await expect(html(page)).toHaveAttribute('data-render-mode', 'full');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the fallback, even with WebGL2', async ({ page }) => {
    await stubWebGL2(page, true);
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
  test(`${path} has the same text and links in both modes`, async ({ browser }) => {
    const fallbackPage = await browser.newPage();
    await stubWebGL2(fallbackPage, false);
    await fallbackPage.goto(path);
    await expect(html(fallbackPage)).toHaveAttribute('data-render-mode', 'fallback');

    const fullPage = await browser.newPage();
    await stubWebGL2(fullPage, true);
    await fullPage.goto(path);
    await expect(html(fullPage)).toHaveAttribute('data-render-mode', 'full');

    expect(await contentOf(fullPage)).toEqual(await contentOf(fallbackPage));
    await fallbackPage.close();
    await fullPage.close();
  });
}
