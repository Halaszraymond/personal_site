/**
 * `/dive.css`: the dive's colours and gauge positions, written at build time from
 * src/lib/dive.ts (see src/lib/dive-css.ts for why this is a file and not inline styles).
 *
 * A file in src/pages/ that exports `GET` is an endpoint: in a static build Astro calls it
 * once and saves what it returns as `dist/dive.css`.
 */
import type { APIRoute } from 'astro';
import { diveStylesheet } from '../lib/dive-css';

export const GET: APIRoute = () =>
  new Response(diveStylesheet(), { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
