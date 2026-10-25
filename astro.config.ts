/**
 * Astro configuration: how the site is built.
 *
 * Astro turns the pages in `src/pages/` into plain HTML files in `dist/`,
 * which Cloudflare Pages serves as-is (a "static" site: no server code per request).
 */
import { defineConfig } from 'astro/config';
import { DEFAULT_LOCALE, LOCALES } from './src/i18n/locales';

export default defineConfig({
  site: 'https://halaszraymond.com',
  // One URL shape everywhere: `/nl/`, never `/nl`. Cloudflare Pages serves folders the same way.
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Load CSS as files instead of inlining it, so the CSP needs no 'unsafe-inline' (see public/_headers).
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Same reason for scripts and small assets: Vite would otherwise inline anything under 4 KB.
      assetsInlineLimit: 0,
    },
  },
  i18n: {
    // `[...LOCALES]` copies the read-only list into a normal array, which is what Astro expects.
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      // English also gets its own prefix (`/en/`), so all three languages look the same.
      prefixDefaultLocale: true,
      // `/` shows English itself instead of redirecting to `/en/` (README §5.1).
      redirectToDefaultLocale: false,
    },
  },
});
