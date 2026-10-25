/**
 * End-to-end tests for the language hint on `/` (spec: i18n-routing, "Language hint on the root").
 * The decision itself is unit-tested in tests/unit/language-hint.test.ts; these tests check
 * that the page shows, hides and remembers it correctly in a real browser.
 */
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { HINT } from '../../src/i18n/ui';

const STORAGE_KEY = 'kalman.lang';

/** Puts a stored choice in localStorage before any page script runs. */
async function storeChoiceBeforeLoad(page: Page, choice: string) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, choice] as const,
  );
}

test.describe('a Hungarian browser', () => {
  test.use({ locale: 'hu-HU' });

  test('sees a Hungarian hint on a first visit', async ({ page }) => {
    await page.goto('/');
    const hint = page.locator('[data-language-hint="hu"]');

    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute('lang', 'hu');
    await expect(hint).toContainText(HINT.hu.message);
    await expect(hint.getByRole('link', { name: HINT.hu.accept })).toHaveAttribute('href', '/hu/');
    await expect(page.locator('[data-language-hint="nl"]')).toBeHidden();
  });

  test('can dismiss the hint, which stays away on later visits', async ({ page }) => {
    await page.goto('/');
    const hint = page.locator('[data-language-hint="hu"]');
    await hint.getByRole('button', { name: HINT.hu.dismiss }).click();

    await expect(hint).toBeHidden();
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('en');

    await page.reload();
    await expect(page.locator('[data-language-hint]')).toHaveCount(2);
    await expect(page.locator('[data-language-hint="hu"]')).toBeHidden();
  });

  test('sees the Dutch hint when Dutch was chosen before', async ({ page }) => {
    await storeChoiceBeforeLoad(page, 'nl');
    await page.goto('/');

    await expect(page.locator('[data-language-hint="nl"]')).toBeVisible();
    await expect(page.locator('[data-language-hint="hu"]')).toBeHidden();
  });

  for (const path of ['/nl/', '/hu/', '/en/']) {
    test(`sees no hint on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('[data-language-hint]')).toHaveCount(0);
    });
  }
});

test.describe('an English browser', () => {
  test.use({ locale: 'en-US' });

  test('sees no hint', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-language-hint="nl"]')).toBeHidden();
    await expect(page.locator('[data-language-hint="hu"]')).toBeHidden();
  });
});

test.describe('a Dutch browser', () => {
  test.use({ locale: 'nl-NL' });

  test('sees a Dutch hint whose link stores the choice', async ({ page }) => {
    await page.goto('/');
    const hint = page.locator('[data-language-hint="nl"]');
    await expect(hint).toBeVisible();

    await hint.getByRole('link', { name: HINT.nl.accept }).click();
    await expect(page).toHaveURL('/nl/');
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('nl');
  });
});
