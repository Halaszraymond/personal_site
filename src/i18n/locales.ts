/**
 * The site's languages, defined once.
 *
 * Everything else (Astro's i18n config, the pages, the switcher, the UI strings)
 * reads from this list, so adding or removing a language happens in one place.
 */

/**
 * The supported languages, in the order the switcher shows them.
 * `as const` makes TypeScript remember the exact values ('nl', 'hu', 'en')
 * instead of just "some strings", which is what makes the `Locale` type below possible.
 */
export const LOCALES = ['nl', 'hu', 'en'] as const;

/**
 * One of the supported languages: 'nl' | 'hu' | 'en'.
 * In Python this would be `Locale = Literal['nl', 'hu', 'en']`.
 */
export type Locale = (typeof LOCALES)[number];

/** English is what `/` shows (README §5.1). */
export const DEFAULT_LOCALE: Locale = 'en';

/** The languages the hint on `/` can offer: every language except English. */
export type HintLocale = Exclude<Locale, 'en'>;

/**
 * Type guard: checks at runtime that a string is one of our languages.
 * After `if (isLocale(x))`, TypeScript treats `x` as a `Locale`
 * (like `isinstance` narrowing in mypy).
 */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
