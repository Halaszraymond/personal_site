/**
 * Unit tests for the hreflang alternates (spec: i18n-routing, "Language alternates for search engines").
 */
import { describe, expect, it } from 'vitest';
import { homeAlternates, localeHomePath } from '../../src/lib/alternates';

const SITE = new URL('https://halaszraymond.com');

describe('localeHomePath', () => {
  it('puts the language between slashes', () => {
    expect(localeHomePath('hu')).toBe('/hu/');
  });
});

describe('homeAlternates', () => {
  it('links every language and x-default with absolute URLs', () => {
    expect(homeAlternates(SITE)).toEqual([
      { hreflang: 'nl', href: 'https://halaszraymond.com/nl/' },
      { hreflang: 'hu', href: 'https://halaszraymond.com/hu/' },
      { hreflang: 'en', href: 'https://halaszraymond.com/en/' },
      { hreflang: 'x-default', href: 'https://halaszraymond.com/' },
    ]);
  });
});
