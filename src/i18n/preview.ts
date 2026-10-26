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
} as const;
