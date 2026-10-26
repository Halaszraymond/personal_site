/**
 * The playground's interface texts.
 *
 * English only while the playground is dev-only (a recorded exception to the
 * three-languages rule, PLANNING_LOG). The shape is ready for more languages: when the
 * playground becomes the public /playground/, the type changes to Record<Locale, …>
 * and TypeScript lists every text that still needs a translation.
 */
import type { ParameterGroup, ParameterKey } from '../lib/kalman-config';

export interface PlaygroundStrings {
  title: string;
  heading: string;
  intro: string;
  /** A label per parameter, shown next to its control. */
  parameters: Record<ParameterKey, string>;
  /** A heading per group of controls. */
  groups: Record<ParameterGroup, string>;
  resetView: string;
  reset: string;
  copyConfig: string;
  copied: string;
  copyRefused: string;
  configLabel: string;
  swimPlay: string;
  swimPause: string;
  noWebGL: string;
  viewLabel: string;
}

export const PLAYGROUND_EN: PlaygroundStrings = {
  title: 'Kálmán playground',
  heading: 'Kálmán playground',
  intro:
    'Shape Keizer Kálmán until he feels right, then copy the config. Drag him to turn him around.',
  parameters: {
    bodyHeight: 'Height',
    bodyGirth: 'Girth',
    bellyRoundness: 'Belly roundness',
    headSize: 'Head size',
    billLength: 'Length',
    billThickness: 'Thickness',
    billDroop: 'Droop',
    earPatchHue: 'Hue (gold ↔ orange)',
    earPatchIntensity: 'Intensity',
    earPatchSpread: 'Spread towards the chest',
    faceting: 'Detail (number of faces)',
    facetedLook: 'Faceted (low-poly) look',
    flipperLength: 'Flipper length',
    strokeAmplitude: 'Stroke size (°)',
    strokeSpeed: 'Strokes per second',
    tieOn: 'Wear the tie',
    tieColour: 'Tie colour',
    tieSize: 'Tie size',
    glassesOn: 'Wear the reading glasses',
    glassesSize: 'Glasses size',
  },
  groups: {
    body: 'Body',
    head: 'Head',
    bill: 'Bill',
    earPatch: 'Ear patches',
    facets: 'Detail & style',
    flippers: 'Flippers',
    swim: 'Swim preview',
    tie: 'Tie',
    glasses: 'Glasses',
  },
  resetView: 'Reset view',
  reset: 'Reset to repo config',
  copyConfig: 'Copy config',
  copied: 'Config copied to the clipboard.',
  copyRefused: 'The browser refused clipboard access: select the JSON below and copy it by hand.',
  configLabel: 'Current config (JSON)',
  swimPlay: 'Play swim preview',
  swimPause: 'Pause swim preview',
  noWebGL:
    'The 3D view needs WebGL2, which this browser does not offer. The controls and Copy config still work.',
  viewLabel: 'Kálmán, 3D view',
};
