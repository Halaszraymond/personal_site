/**
 * Astro configuration: how the site is built.
 *
 * Astro turns the pages in `src/pages/` into plain HTML files in `dist/`,
 * which Cloudflare Pages serves as-is (a "static" site: no server code per request).
 */
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://halaszraymond.com',
  // One URL shape everywhere: `/nl/`, never `/nl`. Cloudflare Pages serves folders the same way.
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
