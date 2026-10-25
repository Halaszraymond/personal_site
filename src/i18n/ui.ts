/**
 * The interface texts (UI strings) in every language.
 *
 * Phase 0 only has placeholder texts. Real content arrives in Phase 3 (README §7).
 * Jokes are written per language, not translated (README §2.5).
 */
import type { HintLocale, Locale } from './locales';

/** Every text a page needs. Each language must provide all of them. */
export interface UiStrings {
  /** The page title in the browser tab. */
  siteTitle: string;
  /** The meta description: the line search engines show under the link. */
  description: string;
  /** Phase 0 test string: proves that each language page shows its own language. */
  testString: string;
  /** The language's own name in the switcher, e.g. "Magyar" rather than "Hungarian". */
  languageName: string;
  /** Label of the language switcher, read out by screen readers. */
  switcherLabel: string;
  /** The 404 page, which shows all three languages at once. */
  notFoundTitle: string;
  notFoundText: string;
  notFoundLink: string;
}

/**
 * `Record<Locale, UiStrings>` means: one `UiStrings` for every language.
 * Like a Python `dict[Locale, UiStrings]`, except the type checker also refuses
 * to build when a language is missing, or when a language is missing a single key.
 */
export const UI: Record<Locale, UiStrings> = {
  nl: {
    siteTitle: 'Keizer Kálmán · Raymond Visser',
    description:
      'Raymond Visser vist patronen uit data. Het portfolio van een data scientist in Budapest, met keizerspinguïn Kálmán als gids.',
    testString: 'Keizer Kálmán maakt zich klaar voor de duik.',
    languageName: 'Nederlands',
    switcherLabel: 'Taal',
    notFoundTitle: 'Pagina niet gevonden',
    notFoundText: 'Deze pagina bestaat niet (meer).',
    notFoundLink: 'Naar de Nederlandse site',
  },
  hu: {
    siteTitle: 'Császár Kálmán · Halász Raymond',
    description:
      'Halász Raymond mintázatokat halász ki az adatokból. Egy budapesti data scientist portfóliója, Császár Kálmánnal.',
    testString: 'Császár Kálmán készül a merülésre.',
    languageName: 'Magyar',
    switcherLabel: 'Nyelv',
    notFoundTitle: 'Az oldal nem található',
    notFoundText: 'Ez az oldal nem létezik (már).',
    notFoundLink: 'Tovább a magyar oldalra',
  },
  en: {
    siteTitle: 'Emperor Kálmán · Raymond Visser',
    description:
      'Raymond Visser fishes patterns out of data. The portfolio of a data scientist in Budapest, guided by Emperor Kálmán.',
    testString: 'Emperor Kálmán is getting ready for the dive.',
    languageName: 'English',
    switcherLabel: 'Language',
    notFoundTitle: 'Page not found',
    notFoundText: "This page doesn't exist (anymore).",
    notFoundLink: 'Go to the English site',
  },
};

/** The texts of the language hint, written in the language it offers. */
export interface HintStrings {
  message: string;
  accept: string;
  dismiss: string;
}

export const HINT: Record<HintLocale, HintStrings> = {
  nl: {
    message: 'Psst… Kálmán spreekt ook Nederlands.',
    accept: 'Naar de Nederlandse site',
    dismiss: 'Nee, Engels is prima',
  },
  hu: {
    message: 'Psszt… Kálmán magyarul is beszél.',
    accept: 'Tovább a magyar oldalra',
    dismiss: 'Maradok az angolnál',
  },
};
