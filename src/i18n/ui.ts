/**
 * The interface texts (UI strings) in every language.
 *
 * The dive's sections still have placeholder texts. Real content arrives in Phase 3 (README §7).
 * Jokes are written per language, not translated (README §2.5).
 */
import type { SectionId } from '../lib/dive';
import type { HintLocale, Locale } from './locales';

/** One section of the dive: its name in the depth gauge, its heading and its text. */
export interface SectionStrings {
  /** Its name in the depth gauge and the express-dive links. */
  name: string;
  /** A very short form for the depth gauge on a phone (a few letters). */
  short: string;
  heading: string;
  /** Placeholder until Phase 3. */
  text: string;
}

/** The dive's texts (spec: dive). */
export interface DiveStrings {
  /** One entry per section; the type requires every section in every language. */
  sections: Record<SectionId, SectionStrings>;
  /** The depth gauge's name for screen readers ("navigation, Depth gauge"). */
  gaugeLabel: string;
  /** The word before the current depth in the gauge. */
  depthLabel: string;
}

/** Every text a page needs. Each language must provide all of them. */
export interface UiStrings {
  /** The page title in the browser tab. */
  siteTitle: string;
  /** The meta description: the line search engines show under the link. */
  description: string;
  /** The dive on the home page. */
  dive: DiveStrings;
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
    dive: {
      sections: {
        ice: {
          name: 'Het ijs',
          short: 'IJs',
          heading: 'Raymond Visser vist patronen uit data',
          text: 'Keizer Kálmán staat aan de rand van het ijs en maakt zich klaar voor de duik. Scroll naar beneden en duik mee.',
        },
        about: {
          name: 'Wie ik ben',
          short: 'Ik',
          heading: 'Wie ik ben',
          text: 'Visser in het Nederlands, Halász in het Hongaars: dezelfde naam, twee landen. Hier komt het verhaal van Nederland naar Boedapest.',
        },
        work: {
          name: 'Werk',
          short: 'Werk',
          heading: 'Werk',
          text: 'Op de diepte waar keizerspinguïns het meest vangen: het werk bij FrieslandCampina, het Leger des Heils en eerder EY. Tekst volgt.',
        },
        education: {
          name: 'Opleiding',
          short: 'Studie',
          heading: 'Opleiding',
          text: 'Het wordt al bijna donker. De master aan de ELTE en de bachelor aan Windesheim komen hier.',
        },
        catch: {
          name: 'De vangst',
          short: 'Vangst',
          heading: 'De vangst',
          text: 'Op 564 meter, het record van een keizerspinguïn, gloeien straks de projecten als diepzeedieren. Voorlopig is het hier nog stil.',
        },
        contact: {
          name: 'Contact',
          short: 'Contact',
          heading: 'Contact',
          text: 'Terug op het ijs. Hier komen LinkedIn, GitHub, e-mail en het cv.',
        },
      },
      gaugeLabel: 'Dieptemeter',
      depthLabel: 'Diepte',
    },
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
    dive: {
      sections: {
        ice: {
          name: 'A jég',
          short: 'Jég',
          heading: 'Halász Raymond mintázatokat halász ki az adatokból',
          text: 'Császár Kálmán a jég szélén áll, és merülésre készül. Görgess lefelé, és merülj vele!',
        },
        about: {
          name: 'Ki vagyok',
          short: 'Én',
          heading: 'Ki vagyok',
          text: 'Hollandul Visser, magyarul Halász: ugyanaz a név, két ország. Ide jön a történet Hollandiától Budapestig.',
        },
        work: {
          name: 'Munka',
          short: 'Munka',
          heading: 'Munka',
          text: 'Abban a mélységben, ahol a császárpingvinek a legtöbbet fogják: a FrieslandCampina, az Üdvhadsereg és korábban az EY. A szöveg hamarosan jön.',
        },
        education: {
          name: 'Tanulmányok',
          short: 'Tanulás',
          heading: 'Tanulmányok',
          text: 'Itt már majdnem sötét van. Ide kerül az ELTE-s mesterképzés és a windesheimi alapképzés.',
        },
        catch: {
          name: 'A fogás',
          short: 'Fogás',
          heading: 'A fogás',
          text: '564 méteren, egy császárpingvin rekordmélységében, mélytengeri lényekként fognak világítani a projektek. Egyelőre még csend van.',
        },
        contact: {
          name: 'Kapcsolat',
          short: 'Írj',
          heading: 'Kapcsolat',
          text: 'Vissza a jégre. Ide jön a LinkedIn, a GitHub, az e-mail és az önéletrajz.',
        },
      },
      gaugeLabel: 'Mélységmérő',
      depthLabel: 'Mélység',
    },
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
    dive: {
      sections: {
        ice: {
          name: 'The ice',
          short: 'Ice',
          heading: 'Raymond Visser fishes patterns out of data',
          text: 'Emperor Kálmán stands at the edge of the ice, getting ready for the dive. Scroll down and dive along.',
        },
        about: {
          name: 'Who I am',
          short: 'Me',
          heading: 'Who I am',
          text: 'Visser in Dutch, Halász in Hungarian: one name, two countries. The story from the Netherlands to Budapest goes here.',
        },
        work: {
          name: 'Work',
          short: 'Work',
          heading: 'Work',
          text: 'At the depth where emperor penguins catch the most: FrieslandCampina, the Salvation Army and, before that, EY. Words to follow.',
        },
        education: {
          name: 'Education',
          short: 'Study',
          heading: 'Education',
          text: 'It is almost dark down here. The MSc at ELTE and the BSc at Windesheim will surface here.',
        },
        catch: {
          name: 'The catch',
          short: 'Catch',
          heading: 'The catch',
          text: 'At 564 m, an emperor penguin’s record, the projects will glow like deep-sea creatures. For now it is quiet down here.',
        },
        contact: {
          name: 'Contact',
          short: 'Contact',
          heading: 'Contact',
          text: 'Back on the ice. LinkedIn, GitHub, email and the CV will be here.',
        },
      },
      gaugeLabel: 'Depth gauge',
      depthLabel: 'Depth',
    },
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
