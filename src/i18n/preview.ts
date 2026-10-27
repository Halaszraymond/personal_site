/**
 * The texts of the dev-only Kálmán preview at /playground/.
 *
 * English only while the preview is dev-only (PLANNING_LOG); when it becomes the public
 * /playground/ in Phase 3, NL and HU are added next to `PREVIEW_EN`. `as const` makes every
 * value a fixed literal, so a typo in a key is a type error.
 */
import type { Figure } from '../lib/kalman-rig';

export const PREVIEW_EN = {
  title: 'Kálmán preview (dev only)',
  heading: 'Kálmán preview',
  intro:
    'Dev-only page: play Kálmán’s animations, and try his poses and moods from the front and from the side.',
  figureLegend: 'Figure',
  figures: { front: 'Front', side: 'Side' },
  animationsLegend: 'Animations',
  /** The play button's text: "Play bow". */
  play: 'Play',
  idleLoop: 'Idle when nothing else plays',
  scrub: 'Position in the animation',
  posesLegend: 'Pose',
  displayLegend: 'Show',
  professional: 'Professional (tie and glasses)',
  showPivots: 'Show pivots',
  rotationsLegend: 'Rotation per layer (degrees)',
  stretchesLegend: 'Squash and stretch per layer (1 = rest)',
  /** A stretch slider's label: "Body stretch", "Side: body stretch". */
  stretch: 'stretch',
  viewLegend: 'View',
  spin: 'Spin whole figure',
  turn: 'Turn around',
  turnHint: 'Or drag Kálmán sideways (front figure).',
  /** "seen from the …" per turntable view. */
  views: {
    front: 'front',
    '3q-front': 'front, at an angle',
    side: 'side',
    '3q-back': 'back, at an angle',
    back: 'back',
    '3q-back-mirrored': 'back, at an angle from the other side',
    'side-mirrored': 'other side',
    '3q-front-mirrored': 'front, at an angle from the other side',
  },
  copyPose: 'Copy pose',
  poseJsonLabel: 'Pose JSON (paste into src/scene/kalman/poses.json)',
  copied: 'Copied the pose to the clipboard.',
  copyFailed: 'The clipboard is not available here: select and copy the text below.',
  moodGoofy: 'goofy',
  moodProfessional: 'professional',
  /** The sliders' labels, per rig layer (front figure). */
  layers: {
    body: 'Body',
    head: 'Head',
    flipperLeft: 'Left flipper',
    flipperRight: 'Right flipper',
    footLeft: 'Left foot',
    footRight: 'Right foot',
    tail: 'Tail',
    tie: 'Tie',
    glasses: 'Glasses',
  },
  /**
   * The side figure's sliders get their own labels ("Side: head"), so no two sliders on the page
   * share a label, even though both figures have a head and a body.
   */
  sideLayers: {
    body: 'Side: body',
    head: 'Side: head',
    flipper: 'Side: flipper',
    footFront: 'Side: front foot',
    footBack: 'Side: back foot',
    tail: 'Side: tail',
    tie: 'Side: tie',
    glasses: 'Side: glasses',
  },
} as const;

/** A layer's label for the sliders; the layer's own name if it has none (a new layer). */
export function layerLabel(name: string, figure: Figure = 'front'): string {
  const labels = figure === 'front' ? PREVIEW_EN.layers : PREVIEW_EN.sideLayers;
  // `Object.entries` gives [key, value] pairs, like `dict.items()` in Python.
  const found = Object.entries(labels).find(([key]) => key === name);
  return found === undefined ? name : found[1];
}
