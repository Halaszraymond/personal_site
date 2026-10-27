/**
 * The dive's build-time stylesheet: the colours of the still dive and the gauge's positions,
 * written from src/lib/dive.ts (dive-scroll design §1, §3, §6).
 *
 * The Content-Security-Policy blocks inline styles (`style="…"`), so per-section values can't be
 * written into the HTML. Instead src/pages/dive.css.ts serves this text as `/dive.css`, and
 * the page's CSS reads the custom properties it sets. One source for the colours, as with the
 * depth mapping. Pure, unit-tested.
 */
import {
  BOTTOM_DEPTH,
  coloursAt,
  middleDepth,
  SECTION_IDS,
  type SectionId,
  type WaterColours,
} from './dive';

/** How far down the gauge 564 m sits (0 = top, 1 = bottom); Contact goes below it, after the ascent. */
export const GAUGE_TRACK_END = 0.88;

/** Where a depth sits on the gauge's track, 0 (surface) to GAUGE_TRACK_END (564 m). */
export function gaugeFraction(depth: number): number {
  const clamped = Math.min(BOTTOM_DEPTH, Math.max(0, depth));
  return Math.round((clamped / BOTTOM_DEPTH) * GAUGE_TRACK_END * 10_000) / 10_000;
}

/**
 * Where a section's entry sits on the gauge: in the middle of its depth range, The ice at the
 * surface, and Contact at the very end (it is reached after the ascent, below The catch).
 */
export function gaugePosition(id: SectionId): number {
  if (id === 'contact') return 1;
  return gaugeFraction(middleDepth(id));
}

/** Custom-property declarations for a set of colours, with a prefix (`--water`, `--section-water`). */
function colourVariables(prefix: string, colours: WaterColours): string {
  return [
    `${prefix}water: ${colours.water};`,
    `${prefix}text: ${colours.text};`,
    `${prefix}accent: ${colours.accent};`,
  ].join(' ');
}

/** The deep blue the gauge sits on in the still dive, where it crosses every section's colour. */
export const PANEL_DEPTH = 400;

/** The whole stylesheet, as text. */
export function diveStylesheet(): string {
  const lines = [
    '/* Built from src/lib/dive.ts by src/pages/dive.css.ts; do not edit. */',
    // The water at the surface: where full mode starts before its script sets the live colours,
    // and the gauge's panel in the still dive.
    `:root { ${colourVariables('--', coloursAt(0))} ${colourVariables('--panel-', coloursAt(PANEL_DEPTH))} }`,
  ];
  for (const id of SECTION_IDS) {
    lines.push(
      `[data-section='${id}'] { ${colourVariables('--section-', coloursAt(middleDepth(id)))} }`,
    );
  }
  for (const id of SECTION_IDS) {
    lines.push(`[data-gauge-entry='${id}'] { --at: ${gaugePosition(id)}; }`);
  }
  return `${lines.join('\n')}\n`;
}
