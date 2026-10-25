/**
 * Builds the URLs that tell search engines which language versions a page has.
 *
 * Each page gets one `<link rel="alternate" hreflang="…">` per language, plus `x-default`:
 * the version for visitors whose language we don't have. For us that is `/` (English).
 * Pure function: values in, values out, so it is unit-tested without a browser.
 */
import { LOCALES } from '../i18n/locales';

/** One alternate link: the `hreflang` value and the absolute URL it points to. */
export interface AlternateLink {
  hreflang: string;
  href: string;
}

/** The path of a language's home page, e.g. `/hu/`. */
export function localeHomePath(locale: string): string {
  return `/${locale}/`;
}

/**
 * All alternate links for the home page, as absolute URLs on `site`.
 * Search engines require absolute URLs here, so `/hu/` becomes `https://…/hu/`.
 */
export function homeAlternates(site: URL): AlternateLink[] {
  const perLanguage = LOCALES.map((locale) => ({
    hreflang: locale,
    href: new URL(localeHomePath(locale), site).href,
  }));
  return [...perLanguage, { hreflang: 'x-default', href: new URL('/', site).href }];
}
