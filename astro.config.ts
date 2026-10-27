/**
 * Astro configuration: how the site is built.
 *
 * Astro turns the pages in `src/pages/` into plain HTML files in `dist/`,
 * which Cloudflare Pages serves as-is (a "static" site: no server code per request).
 */
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { DEFAULT_LOCALE, LOCALES } from './src/i18n/locales';
import { shouldIncludePlayground } from './src/lib/playground-flag';

/**
 * Adds the dev-only Kálmán preview at /playground/, but only in the development server and
 * in builds with PLAYGROUND=1 (CI, Cloudflare branch previews). In a production build the
 * route doesn't exist, so its page and script never ship (spec: kalman-preview).
 * An integration is a plug-in that hooks into Astro's setup, a bit like a pytest plugin.
 */
function kalmanPreview(): AstroIntegration {
  return {
    name: 'kalman-preview',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, logger }) => {
        const flag = process.env['PLAYGROUND'];
        if (shouldIncludePlayground({ command, flag })) {
          injectRoute({
            pattern: '/playground',
            entrypoint: './src/playground/PreviewPage.astro',
          });
          logger.info('Kálmán preview: included at /playground/');
        } else {
          // Say why, so a missing preview variable is visible in the Cloudflare build log.
          logger.info(
            `Kálmán preview: excluded (PLAYGROUND is ${flag === undefined ? 'not set' : `"${flag}"`})`,
          );
        }
      },
    },
  };
}

export default defineConfig({
  site: 'https://halaszraymond.com',
  integrations: [kalmanPreview()],
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
