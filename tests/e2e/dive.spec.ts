/**
 * End-to-end tests for the dive on the home pages (spec: dive; render-fallback "The dive scene";
 * kalman-rig "The figure loads only what it shows"). Scenario names in quotes are from the specs.
 *
 * Full mode is the default in these browsers; the still dive is reached with reduced motion.
 */
import type { Page } from '@playwright/test';
import { contrast } from '../../src/lib/colour';
import { LOCALES, type Locale } from '../../src/i18n/locales';
import { UI } from '../../src/i18n/ui';
import { expect, test } from './fixtures';

const SECTION_IDS = ['ice', 'about', 'work', 'education', 'catch', 'contact'] as const;

const gauge = (page: Page, locale: Locale = 'en') =>
  page.getByRole('navigation', { name: UI[locale].dive.gaugeLabel });
const depthValue = (page: Page) => page.locator('[data-depth-value]');
const stageFigure = (page: Page) => page.locator('[data-dive-stage] [data-kalman-figure]');

/** Scrolls so the depth probe (the middle of the viewport) is `offset` px into a section. */
async function probeInto(page: Page, id: string, offset = 100) {
  await page.evaluate(
    ([sectionId, by]) => {
      const section = document.getElementById(String(sectionId));
      if (section === null) throw new Error(`No section ${String(sectionId)}`);
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + Number(by) - window.innerHeight / 2);
    },
    [id, offset],
  );
}

/** Scrolls in small steps, as a visitor does, so the dive sees every zone on the way. */
async function scrollStepwise(page: Page, to: number) {
  await page.evaluate(async (wanted) => {
    // Never past the end of the page, or the loop would wait for a scroll that can't happen.
    const target = Math.min(wanted, document.documentElement.scrollHeight - window.innerHeight);
    const step = target > window.scrollY ? 150 : -150;
    while (Math.abs(target - window.scrollY) > Math.abs(step)) {
      window.scrollBy(0, step);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, target);
  }, to);
}

for (const locale of LOCALES) {
  test(`"Sections in order" in /${locale}/`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const headings = page.locator('[data-section] :is(h1, h2)');
    await expect(headings).toHaveText(
      SECTION_IDS.map((id) => UI[locale].dive.sections[id].heading),
    );
    await expect(page.locator('[data-section]')).toHaveCount(SECTION_IDS.length);
    for (const [i, id] of SECTION_IDS.entries()) {
      await expect(page.locator('[data-section]').nth(i)).toHaveAttribute('id', id);
    }
  });

  test(`"Linking to a section" in /${locale}/`, async ({ page }) => {
    await page.goto(`/${locale}/#catch`);
    await expect(page.locator('#catch-heading')).toBeInViewport();
    await expect(
      gauge(page, locale).getByRole('link', { name: UI[locale].dive.sections.catch.name }),
    ).toHaveAttribute('aria-current', 'location');
  });
}

test('the gauge is navigation with a link per section', async ({ page }) => {
  await page.goto('/en/');
  const links = gauge(page).getByRole('link');
  await expect(links).toHaveCount(SECTION_IDS.length);
  for (const id of SECTION_IDS) {
    await expect(
      gauge(page).getByRole('link', { name: UI.en.dive.sections[id].name }),
    ).toHaveAttribute('href', `#${id}`);
  }
  await expect(depthValue(page)).toHaveText('0');
});

test('"Following the depth"', async ({ page }) => {
  await page.goto('/en/');
  await probeInto(page, 'education', 200);
  await expect.poll(async () => Number(await depthValue(page).textContent())).toBeGreaterThan(250);
  expect(Number(await depthValue(page).textContent())).toBeLessThan(400);
  await expect(gauge(page).getByRole('link', { name: 'Education' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test('"The ascent": the gauge counts back to 0 m at Contact', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(depthValue(page)).toHaveText('0');
  await expect(gauge(page).getByRole('link', { name: 'Contact' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test('the water follows the depth, with readable text', async ({ page }) => {
  await page.goto('/en/');
  const colours = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.body);
      // Computed colours come back as `rgb(r, g, b)`; turn them into hex for contrast().
      const hex = (rgb: string) =>
        `#${(rgb.match(/\d+/g) ?? [])
          .slice(0, 3)
          .map((n) => Number(n).toString(16).padStart(2, '0'))
          .join('')}`;
      return { water: hex(style.backgroundColor), text: hex(style.color) };
    });
  const atSurface = await colours();
  await probeInto(page, 'catch', 300);
  await expect.poll(async () => (await colours()).water).not.toBe(atSurface.water);
  // "Contrast at every depth", sampled on the page: the surface, the deep, and halfway down.
  for (const id of ['about', 'work', 'catch']) {
    await probeInto(page, id, 150);
    await page.waitForTimeout(100);
    const { water, text } = await colours();
    expect(contrast(text, water), `${id}: ${text} on ${water}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('"Express dive to The catch"', async ({ page }) => {
  await page.goto('/en/');
  const started = Date.now();
  await gauge(page).getByRole('link', { name: 'The catch' }).click();
  await expect(page.locator('#catch-heading')).toBeFocused();
  // About a second: the 0.8 s dive, with room for a slow test machine.
  expect(Date.now() - started).toBeLessThan(2500);
  await expect(page.locator('#catch-heading')).toBeInViewport();
  expect(new URL(page.url()).hash).toBe('#catch');
});

test('the gauge works with the keyboard', async ({ page }) => {
  await page.goto('/en/');
  const work = gauge(page).getByRole('link', { name: 'Work' });
  await work.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#work-heading')).toBeFocused();
  await expect(page.locator('#work-heading')).toBeInViewport();
});

test('"The dive scene": the scene slot holds Kálmán, decorative only', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-render-mode', 'full');
  await expect(page.locator('[data-scene-slot]')).toHaveAttribute('aria-hidden', 'true');
  await expect(stageFigure(page)).toBeVisible();
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'onIce');
  // The stills are the fallback's; full mode hides them.
  await expect(page.locator('[data-still]').first()).toBeHidden();
});

test('"The first scroll": Kálmán dives, then swims', async ({ page }) => {
  await page.goto('/en/');
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'onIce');
  await page.evaluate(() => window.scrollBy(0, 300));
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'diving');
  await expect(stageFigure(page)).toHaveAttribute('data-animation', 'dive');
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'swimming', {
    timeout: 8000,
  });
  await expect(stageFigure(page)).toHaveAttribute('data-animation', 'swim');
});

test('"The ascent": Kálmán launches and ends on the ice at Contact', async ({ page }) => {
  await page.goto('/en/#catch');
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'swimming');
  await scrollStepwise(page, await page.evaluate(() => document.documentElement.scrollHeight));
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'launching');
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'ashore', { timeout: 8000 });
});

test('"Scrolling back up": back at The ice, Kálmán stands on it', async ({ page }) => {
  await page.goto('/en/#work');
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'swimming');
  await scrollStepwise(page, 0);
  await expect(stageFigure(page)).toHaveAttribute('data-dive-state', 'onIce');
  await expect(stageFigure(page)).toHaveAttribute('data-animation', 'idle');
});

test('"The dive without the turntable": no turntable views or drawn poses', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('[data-turntable], [data-view]')).toHaveCount(0);
  await expect(page.locator('[data-drawn-poses], [data-drawn-pose]')).toHaveCount(0);
  await expect(page.locator('image[href*="view-"]')).toHaveCount(0);
});

test('the side and swimming figures only load after the page has loaded', async ({ page }) => {
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  const timing = await page.evaluate(() => {
    const deferred = [
      ...document.querySelectorAll(
        '[data-dive-stage] [data-layers]:not([data-figure="front"]) image',
      ),
    ].map((image) => new URL(image.getAttribute('href') ?? '', location.href).href);
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const starts = performance
      .getEntriesByType('resource')
      .filter((entry) => deferred.includes(entry.name))
      .map((entry) => entry.startTime);
    return { count: deferred.length, starts, loadEnd: navigation.loadEventStart };
  });
  expect(timing.count).toBeGreaterThan(0);
  expect(timing.starts.length).toBeGreaterThan(0);
  for (const start of timing.starts) expect(start).toBeGreaterThanOrEqual(timing.loadEnd);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`"On a phone" (${reducedMotion}): the gauge fits beside the text`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto('/en/');
      await expect(gauge(page)).toBeVisible();
      const noSideScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(noSideScroll).toBe(true);
      const gaugeBox = await gauge(page).boundingBox();
      for (const id of SECTION_IDS) {
        await page.locator(`#${id}-heading`).scrollIntoViewIfNeeded();
        for (const block of await page.locator(`#${id} :is(h1, h2, p)`).all()) {
          const box = await block.boundingBox();
          expect(box && gaugeBox && box.x + box.width <= gaugeBox.x + 1, `${id}`).toBe(true);
        }
      }
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('"Reduced motion": the still dive, with a colour and a still Kálmán per section', async ({
    page,
  }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('data-render-mode', 'fallback');
    await expect(page.locator('[data-scene-slot]')).toBeHidden();
    const backgrounds = new Set<string>();
    for (const id of SECTION_IDS) {
      const section = page.locator(`#${id}`);
      await expect(section.locator('[data-still] [data-kalman-figure]')).toBeVisible();
      await expect(section.locator(':is(h1, h2)')).toBeVisible();
      backgrounds.add(await section.evaluate((el) => getComputedStyle(el).backgroundColor));
    }
    // Ice and Contact share the surface colour; the others each have their own.
    expect(backgrounds.size).toBe(SECTION_IDS.length - 1);
    // Nothing moves by itself: no player ever starts.
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(500);
    await expect(page.locator('[data-animation]')).toHaveCount(0);
  });

  test('the stills draw only the front figure', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('[data-still] [data-layers]:not([data-figure="front"])')).toHaveCount(
      0,
    );
  });

  test('"Express dive with reduced motion": straight to Work', async ({ page }) => {
    await page.goto('/en/');
    await gauge(page).getByRole('link', { name: 'Work' }).click();
    // At once: already there on the next check, with focus on the heading.
    await expect(page.locator('#work-heading')).toBeFocused({ timeout: 300 });
    await expect(page.locator('#work-heading')).toBeInViewport();
    expect(new URL(page.url()).hash).toBe('#work');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('"Without JavaScript": sections, gauge links and stills are all there', async ({ page }) => {
    await page.goto('/en/');
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}-heading`)).toHaveText(UI.en.dive.sections[id].heading);
      await expect(page.locator(`#${id} [data-still] [data-kalman-figure]`)).toBeVisible();
    }
    await expect(gauge(page).getByRole('link')).toHaveCount(SECTION_IDS.length);
  });
});
