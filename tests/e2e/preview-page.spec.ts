/**
 * End-to-end tests for the preview page itself: hidden from the public, English, no
 * language switcher (specs: kalman-preview "Hidden from the public"; i18n-routing,
 * the modified alternates and switcher requirements).
 *
 * Runs against the playground build (`npm run build:playground`), which CI makes before the
 * e2e tests. The production build is checked separately by `npm run check:production`.
 */
import { expect, test } from './fixtures';

test('the preview is English, not indexed and has no alternates', async ({ page }) => {
  const response = await page.goto('/playground/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('the preview has no language switcher', async ({ page }) => {
  await page.goto('/playground/');
  await expect(page.getByRole('navigation', { name: 'Language' })).toHaveCount(0);
});

test('the 404 page has no alternates', async ({ page }) => {
  await page.goto('/does-not-exist/');
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('no public page links to the preview', async ({ page }) => {
  for (const path of ['/', '/nl/', '/hu/', '/en/']) {
    await page.goto(path);
    await expect(page.locator('a[href*="playground"]')).toHaveCount(0);
  }
});
