/**
 * The texts of the dev-only Kálmán preview at /playground/.
 *
 * English only while the preview is dev-only (PLANNING_LOG); when it becomes the public
 * /playground/ in Phase 3, NL and HU are added next to `PREVIEW_EN`. `as const` makes every
 * value a fixed literal, so a typo in a key is a type error.
 */
export const PREVIEW_EN = {
  title: 'Kálmán preview (dev only)',
  heading: 'Kálmán preview',
  intro:
    'Dev-only page: try Kálmán’s poses and moods. The layers are placeholders until the real illustrations arrive.',
  posesLegend: 'Pose',
  displayLegend: 'Show',
  professional: 'Professional (tie and glasses)',
  showPivots: 'Show pivots',
  rotationsLegend: 'Rotation per layer (degrees)',
  viewLegend: 'View',
  spin: 'Spin whole figure',
  turn: 'Turn around',
  turnHint: 'Or drag Kálmán sideways.',
  views: {
    front: 'front',
    'side-right': 'right side',
    back: 'back',
    'side-left': 'left side',
  },
  copyPose: 'Copy pose',
  poseJsonLabel: 'Pose JSON (paste into src/scene/kalman/poses.json)',
  copied: 'Copied the pose to the clipboard.',
  copyFailed: 'The clipboard is not available here: select and copy the text below.',
  moodGoofy: 'goofy',
  moodProfessional: 'professional',
  /** The sliders' labels, per rig layer. */
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
} as const;

/** A layer's label for the sliders; the layer's own name if it has none (a new layer). */
export function layerLabel(name: string): string {
  // `Object.entries` gives [key, value] pairs, like `dict.items()` in Python.
  const found = Object.entries(PREVIEW_EN.layers).find(([key]) => key === name);
  return found === undefined ? name : found[1];
}
