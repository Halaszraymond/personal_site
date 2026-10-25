/**
 * Decides whether the root `/` shows a language hint, and for which language.
 *
 * Pure logic: it gets the stored choice and the browser's languages as values,
 * so it can be tested without a browser. The client script in LanguageHint.astro
 * collects those values and shows the hint this function picks.
 */
import { isLocale, type HintLocale, type Locale } from '../i18n/locales';

/** What the decision is based on. */
export interface HintInput {
  /** The language the visitor chose before, or `null` if they never chose. */
  storedChoice: Locale | null;
  /** The browser's languages in order of preference, like `navigator.languages`: `['hu-HU', 'en']`. */
  browserLanguages: readonly string[];
}

/**
 * The first browser language we support, or `null`.
 *
 * Browsers report tags like `hu-HU` or `nl-BE`: language plus region. Only the language
 * part matters to us. Languages we don't have (German, French…) are skipped, so the
 * visitor's next preference counts, but the order is respected: `['en', 'hu']` means English.
 */
export function firstSupportedLanguage(browserLanguages: readonly string[]): Locale | null {
  for (const tag of browserLanguages) {
    // 'hu-HU' → 'hu'. `split` always returns at least one element, but TypeScript's
    // `strictest` mode can't know that, so `?? ''` covers the impossible case.
    const language = (tag.split('-')[0] ?? '').toLowerCase();
    if (isLocale(language)) {
      return language;
    }
  }
  return null;
}

/**
 * The language to offer in the hint, or `null` for no hint.
 *
 * 1. A stored choice wins: Dutch or Hungarian → offer it; English → no hint
 *    (English is also stored when the visitor dismisses the hint).
 * 2. Otherwise the browser's preferred supported language decides, in the same way.
 */
export function chooseLanguageHint({
  storedChoice,
  browserLanguages,
}: HintInput): HintLocale | null {
  const language = storedChoice ?? firstSupportedLanguage(browserLanguages);
  if (language === null || language === 'en') {
    return null;
  }
  return language;
}
