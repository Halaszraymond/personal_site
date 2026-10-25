/**
 * End-to-end tests for the language URLs (spec: i18n-routing).
 *
 * Covers: one URL prefix per language, the root showing English without a redirect,
 * the canonical link and the hreflang alternates.
 */
import { expect, test } from './fixtures';
import { LOCALES } from '../../src/i18n/locales';
import { UI } from '../../src/i18n/ui';

const SITE = 'https://halaszraymond.com';

for (const locale of LOCALES) {
  test(`/${locale}/ shows the ${locale} page`, async ({ page }) => {
    const response = await page.goto(`/${locale}/`);

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI[locale].testString);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE}/${locale}/`,
    );
  });
}

test('every language page links its alternates and x-default', async ({ page }) => {
  for (const locale of LOCALES) {
    await page.goto(`/${locale}/`);
    const alternates = page.locator('link[rel="alternate"]');

    await expect(alternates).toHaveCount(4);
    for (const other of LOCALES) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute(
        'href',
        `${SITE}/${other}/`,
      );
    }
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      `${SITE}/`,
    );
  }
});

test.describe('the root for a Dutch browser', () => {
  // Pretend the browser's preferred language is Dutch.
  test.use({ locale: 'nl-NL' });

  test('shows English at / without redirecting', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    // No redirect: the final URL is still the root.
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.en.testString);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/en/`);
  });
});
