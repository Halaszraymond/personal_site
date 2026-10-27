/**
 * The dive: its sections and depths, scroll position → depth, depth → water colour, and what
 * Kálmán does where (spec: dive; dive-scroll design §2–§4).
 *
 * Everything here decides something, so it is pure and unit-tested; the dive's browser script
 * (src/scene/scroll/) only measures the page, asks these functions and applies the answers.
 * The page, the gauge and the depth mapping all read the sections from here, so they can
 * never disagree.
 */
import { contrast, mixOklab, readableOn } from './colour';

// -------------------------------------------------------------------------------------------
// The sections
// -------------------------------------------------------------------------------------------

/** The deepest point of the dive, at the bottom of The catch: the emperor's record (README §2.3). */
export const BOTTOM_DEPTH = 564;

/** The sections in page order; the ids are also the anchors in the URL (`/en/#work`). */
export const SECTION_IDS = ['ice', 'about', 'work', 'education', 'catch', 'contact'] as const;
/** One of the section ids, like a `Literal['ice', …]` in Python. */
export type SectionId = (typeof SECTION_IDS)[number];

export interface Section {
  readonly id: SectionId;
  /** The depth at the start of the section, in metres. */
  readonly depth: number;
  /** The depth at its end; for Contact, reached after the ascent, it is 0 again. */
  readonly endDepth: number;
}

/** The sections with their depths from README §2.3. */
export const SECTIONS: readonly Section[] = [
  { id: 'ice', depth: 0, endDepth: 0 },
  { id: 'about', depth: 0, endDepth: 100 },
  { id: 'work', depth: 100, endDepth: 250 },
  { id: 'education', depth: 250, endDepth: 400 },
  { id: 'catch', depth: 400, endDepth: BOTTOM_DEPTH },
  { id: 'contact', depth: 0, endDepth: 0 },
];

/** A section by id (every id in SECTION_IDS has one, so this never fails). */
export function sectionById(id: SectionId): Section {
  const section = SECTIONS.find((s) => s.id === id);
  if (section === undefined) throw new Error(`No section "${id}"`);
  return section;
}

/**
 * Kálmán's pose per section in the still dive (design §6): front-figure poses from poses.json,
 * so the fallback only needs the front figure's images.
 */
export const STILL_POSES: Readonly<Record<SectionId, string>> = {
  ice: 'rest',
  about: 'headTiltRight',
  work: 'flippersUp',
  education: 'headTiltLeft',
  catch: 'bow',
  contact: 'rest',
};

/** The depth in the middle of a section: the colour the still dive gives it. */
export function middleDepth(id: SectionId): number {
  const { depth, endDepth } = sectionById(id);
  return (depth + endDepth) / 2;
}

// -------------------------------------------------------------------------------------------
// Scroll position → depth (design §2)
// -------------------------------------------------------------------------------------------

/** A point on the page (in px from the top of the document) with the depth it stands for. */
export interface Anchor {
  readonly position: number;
  readonly depth: number;
}

/** Where the page's sections are, as measured by the dive script (px from the document top). */
export interface DiveLayout {
  /** The top of each section. */
  readonly starts: Readonly<Record<SectionId, number>>;
  /** The bottom of The catch: 564 m, where the ascent begins. */
  readonly catchBottom: number;
}

/**
 * The anchors of the depth mapping: each section's start at its depth, plus the two of the
 * ascent: the bottom of The catch at 564 m and the start of Contact back at 0 m.
 */
export function diveAnchors(layout: DiveLayout): Anchor[] {
  const anchors: Anchor[] = SECTIONS.filter((s) => s.id !== 'contact').map((s) => ({
    position: layout.starts[s.id],
    depth: s.depth,
  }));
  anchors.push({ position: layout.catchBottom, depth: BOTTOM_DEPTH });
  anchors.push({ position: layout.starts.contact, depth: 0 });
  return anchors;
}

/**
 * The depth at `probe` (a position on the page): straight lines between the anchors around
 * it, and the first or last anchor's depth beyond them. Continuous, so the gauge never jumps.
 * The anchors must be in page order (as diveAnchors() gives them).
 */
export function depthAt(probe: number, anchors: readonly Anchor[]): number {
  const first = anchors[0];
  const last = anchors.at(-1);
  if (first === undefined || last === undefined) return 0;
  if (probe <= first.position) return first.depth;
  if (probe >= last.position) return last.depth;
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const from = anchors[i];
    const to = anchors[i + 1];
    if (from === undefined || to === undefined) continue;
    if (probe >= from.position && probe < to.position) {
      const t = (probe - from.position) / (to.position - from.position);
      return from.depth + (to.depth - from.depth) * t;
    }
  }
  return last.depth;
}

/**
 * Where on the page the depth is read: the middle of the viewport, except over the last half
 * screen of scrolling, where it slides down to the bottom of the page. So at the very bottom
 * the probe reaches Contact, however short Contact is (it reads 0 m there).
 */
export function probePosition(scrollY: number, viewportHeight: number, pageHeight: number): number {
  const middle = scrollY + viewportHeight / 2;
  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  const slideFrom = maxScroll - viewportHeight / 2;
  if (scrollY <= slideFrom || viewportHeight <= 0) return middle;
  const t = Math.min(1, (scrollY - slideFrom) / (viewportHeight / 2));
  return middle + (viewportHeight / 2) * t;
}

/** Where on the dive a probe is: in a section, or in the ascent between The catch and Contact. */
export type Zone = SectionId | 'ascent';

/** The zone at `probe`: the last section that starts above it, or the ascent. */
export function zoneAt(probe: number, layout: DiveLayout): Zone {
  if (probe >= layout.catchBottom && probe < layout.starts.contact) return 'ascent';
  let zone: SectionId = 'ice';
  for (const id of SECTION_IDS) {
    if (probe >= layout.starts[id]) zone = id;
  }
  return zone;
}

/** The section the gauge marks as current: the ascent belongs to Contact, where it leads. */
export function currentSection(zone: Zone): SectionId {
  return zone === 'ascent' ? 'contact' : zone;
}

// -------------------------------------------------------------------------------------------
// Depth → colour (design §3)
// -------------------------------------------------------------------------------------------

/** The water's colour stops: ice blue at the surface to ink black at the bottom (README §2.6). */
export const WATER_STOPS: readonly { readonly depth: number; readonly colour: string }[] = [
  { depth: 0, colour: '#cfe7f2' }, // ice blue
  { depth: 100, colour: '#2d6a92' }, // sunlit blue: light still filters through
  { depth: 250, colour: '#123a5c' }, // twilight blue
  { depth: 400, colour: '#081c30' }, // deep blue, almost dark
  { depth: BOTTOM_DEPTH, colour: '#03070d' }, // ink black
];

/** The two text colours: dark ink on light water, foam white on dark water. */
export const TEXT_DARK = '#06121e';
export const TEXT_LIGHT = '#f4f8fb';
/** The golden-orange accent (gauge, links' focus, the marker). */
export const ACCENT = '#f2a33a';
/** WCAG AA for normal text. */
export const MIN_CONTRAST = 4.5;

/** The water colour at `depth`: blended in OKLab between the stops around it. */
export function waterAt(depth: number): string {
  const first = WATER_STOPS[0];
  const last = WATER_STOPS.at(-1);
  if (first === undefined || last === undefined) return '#000000';
  if (depth <= first.depth) return first.colour;
  if (depth >= last.depth) return last.colour;
  for (let i = 0; i < WATER_STOPS.length - 1; i += 1) {
    const from = WATER_STOPS[i];
    const to = WATER_STOPS[i + 1];
    if (from === undefined || to === undefined) continue;
    if (depth >= from.depth && depth < to.depth) {
      return mixOklab(from.colour, to.colour, (depth - from.depth) / (to.depth - from.depth));
    }
  }
  return last.colour;
}

/**
 * The text colour for `background`: dark or light, whichever contrasts more, made a touch darker
 * or lighter where the water is mid-tone and neither reaches 4.5:1 as it is.
 */
export function textFor(background: string): string {
  const preferred =
    contrast(TEXT_DARK, background) >= contrast(TEXT_LIGHT, background) ? TEXT_DARK : TEXT_LIGHT;
  return readableOn(preferred, background, MIN_CONTRAST);
}

/** The accent for `background`: the golden orange, lightened or darkened just enough for 4.5:1. */
export function accentFor(background: string): string {
  return readableOn(ACCENT, background, MIN_CONTRAST);
}

/** The colours of the page at `depth`: water, text and accent. */
export interface WaterColours {
  readonly water: string;
  readonly text: string;
  readonly accent: string;
}

export function coloursAt(depth: number): WaterColours {
  const water = waterAt(depth);
  return { water, text: textFor(water), accent: accentFor(water) };
}

// -------------------------------------------------------------------------------------------
// What Kálmán does (design §4)
// -------------------------------------------------------------------------------------------

/**
 * Kálmán's state in the dive: standing on the ice, diving in (once), swimming, launching out of
 * the water (once, with the belly landing), and standing on the ice again at Contact.
 */
export type DiveState = 'onIce' | 'diving' | 'swimming' | 'launching' | 'ashore';

/** Which way the visitor is scrolling. */
export type Direction = 'down' | 'up' | 'none';

/** The animation (animations.json) each state plays. */
export const ANIMATION_OF: Readonly<Record<DiveState, string>> = {
  onIce: 'idle',
  diving: 'dive',
  swimming: 'swim',
  launching: 'launch',
  ashore: 'idle',
};

/** The state on arrival at `zone` without a previous state (the page opened there). */
export function initialState(zone: Zone): DiveState {
  if (zone === 'ice') return 'onIce';
  if (zone === 'contact') return 'ashore';
  return 'swimming';
}

/**
 * The next state, from the previous one, where the visitor is now and which way they scroll.
 * A one-shot state (diving, launching) holds until its animation finishes (see afterOneShot),
 * unless the visitor reverses direction, which cuts it short. The zone says all the depth
 * would (The ice is 0 m, the ascent rises), so the depth itself is not needed.
 */
export function diveState(previous: DiveState, zone: Zone, direction: Direction): DiveState {
  if (direction === 'none') return previous;
  const up = direction === 'up';
  switch (zone) {
    case 'ice':
      // Scrolling back up into The ice puts him back on it; the first scroll down dives.
      if (up) return 'onIce';
      return previous === 'onIce' ? 'diving' : previous;
    case 'contact':
      // At Contact he ends on the ice; arriving any other way (an express dive) launches first.
      return previous === 'ashore' || previous === 'launching' ? previous : 'launching';
    case 'ascent':
      // Going down through the ascent he launches; going back up he swims again.
      if (up) return 'swimming';
      return previous === 'launching' || previous === 'ashore' ? previous : 'launching';
    default:
      // The sections under water: dive in if he was still on the ice, otherwise swim. A dive
      // still playing goes on while scrolling down; reversing cuts it (and a launch) short.
      if (previous === 'onIce') return 'diving';
      if (previous === 'diving') return up ? 'swimming' : 'diving';
      return 'swimming';
  }
}

/** The state after a one-shot animation has finished: the dive becomes the swim, the launch the rest. */
export function afterOneShot(state: DiveState): DiveState {
  if (state === 'diving') return 'swimming';
  if (state === 'launching') return 'ashore';
  return state;
}
