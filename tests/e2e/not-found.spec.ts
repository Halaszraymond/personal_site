/**
 * End-to-end test for unknown URLs (spec: i18n-routing, "Unknown URLs return a real 404").
 *
 * Local difference with production: Astro's preview server only serves our 404.html for
 * paths that end in a slash. For `/does-not-exist` it shows its own development notice
 * (still with status 404), where Cloudflare Pages serves 404.html. So the full page is
 * tested at `/does-not-exist/`, and the slash-less URL on its status only. The real
 * Cloudflare behaviour is checked on the preview deployment (task 5.4).
 */
import { expect, test } from '@playwright/test';
import { LOCALES } from '../../src/i18n/locales';
import { UI } from '../../src/i18n/ui';

test('an unknown URL returns 404 with links home in every language', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');

  expect(response?.status()).toBe(404);
  for (const locale of LOCALES) {
    await expect(
      page.getByRole('main').getByRole('link', { name: UI[locale].notFoundLink }),
    ).toHaveAttribute('href', `/${locale}/`);
  }
  // Error pages must stay out of search results.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('an unknown URL without a trailing slash also returns 404', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
});
