/**
 * End-to-end tests for the language switcher and the remembered choice
 * (spec: i18n-routing, "Language switcher on every page" and "The visitor's language choice is remembered").
 */
import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'kalman.lang';

/** The switcher's navigation landmark, found by its role, as a screen reader would. */
function switcher(page: Page) {
  return page.getByRole('navigation', { name: 'Language' });
}

/** Collects JavaScript errors and console errors, so a test can assert there were none. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('switching from English to Hungarian', async ({ page }) => {
  await page.goto('/en/');
  await switcher(page).getByRole('link', { name: 'Magyar' }).click();
  await expect(page).toHaveURL('/hu/');
});

test('the current language is marked for assistive technology', async ({ page }) => {
  await page.goto('/nl/');
  const dutch = page.getByRole('navigation', { name: 'Taal' }).getByRole('link', {
    name: 'Nederlands',
  });
  await expect(dutch).toHaveAttribute('aria-current', 'page');
});

test('the switcher works with the keyboard', async ({ page }) => {
  await page.goto('/en/');
  const hungarian = switcher(page).getByRole('link', { name: 'Magyar' });
  // Tab through the page until the Hungarian link has focus, then press Enter.
  for (let tabs = 0; tabs < 10; tabs++) {
    await page.keyboard.press('Tab');
    if (await hungarian.evaluate((link) => link === document.activeElement)) break;
  }
  await expect(hungarian).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/hu/');
});

test('the choice is stored in the browser, without a cookie', async ({ page, context }) => {
  await page.goto('/en/');
  await switcher(page).getByRole('link', { name: 'Nederlands' }).click();
  await expect(page).toHaveURL('/nl/');

  const stored = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  expect(stored).toBe('nl');
  expect(await context.cookies()).toEqual([]);
});

test('blocked storage: switching still works and nothing errors', async ({ page }) => {
  // Make every access to localStorage throw, as some privacy settings do.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    });
  });
  const errors = collectErrors(page);

  await page.goto('/en/');
  await switcher(page).getByRole('link', { name: 'Magyar' }).click();
  await expect(page).toHaveURL('/hu/');
  expect(errors).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the switcher links still navigate', async ({ page }) => {
    await page.goto('/en/');
    await switcher(page).getByRole('link', { name: 'Magyar' }).click();
    await expect(page).toHaveURL('/hu/');
  });
});
