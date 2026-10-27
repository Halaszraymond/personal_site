/**
 * The pose the Kálmán preview shows, worked out from its controls (spec: kalman-preview).
 *
 * The preview starts from a named pose (the last pose button pressed) and lets the sliders
 * override each layer's rotation and, for layers that may stretch, its stretch. Offsets aren't
 * on sliders, so they stay as the named pose has them. Once a slider differs from the named pose, the result is no longer that pose but
 * a "custom" one, which is what "Copy pose" exports. Pure, so it is unit-tested.
 */
import { figureOf, type LayerPose, type Pair, type Pose } from './kalman-rig';

/** The name and label a pose gets once the sliders have changed it. */
export const CUSTOM_POSE = { name: 'custom', label: 'Custom' } as const;

/**
 * The named pose `base` with every layer's rotation taken from `rotations` (layer name →
 * degrees) and its stretch from `stretches` (layer name → stretch, 1 = rest). Layers at rest
 * (0°, no offset, stretch 1) are left out, and so are the fields at rest, so the JSON stays as
 * short as the poses in poses.json.
 */
export function poseFromControls(
  base: Pose,
  rotations: Readonly<Record<string, number>>,
  stretches: Readonly<Record<string, number>> = {},
): Pose {
  const names = new Set([
    ...Object.keys(base.layers),
    ...Object.keys(rotations),
    ...Object.keys(stretches),
  ]);
  const layers: Record<string, LayerPose> = {};
  let changed = false;
  for (const name of names) {
    const offset = base.layers[name]?.offset;
    const rotate = rotations[name] ?? base.layers[name]?.rotate ?? 0;
    const stretch = stretches[name] ?? base.layers[name]?.stretch ?? 1;
    if (rotate !== (base.layers[name]?.rotate ?? 0)) changed = true;
    if (stretch !== (base.layers[name]?.stretch ?? 1)) changed = true;
    // Build the layer entry with only the fields that matter, in a fixed order.
    const entry: { rotate?: number; offset?: Pair; stretch?: number } = {};
    if (rotate !== 0) entry.rotate = rotate;
    if (offset !== undefined) entry.offset = offset;
    if (stretch !== 1) entry.stretch = stretch;
    if (Object.keys(entry).length > 0) layers[name] = entry;
  }
  // The figure comes along, so a copied side pose is pasted into poses.json as a side pose.
  const figure = figureOf(base);
  return changed
    ? { ...CUSTOM_POSE, figure, layers }
    : { name: base.name, label: base.label, figure, layers };
}

/** The pose as JSON for "Copy pose", indented like poses.json (`json.dumps(pose, indent=2)`). */
export function poseToJson(pose: Pose): string {
  return JSON.stringify(pose, null, 2);
}

/**
 * The figure's description for screen readers, e.g. "Kálmán, pose: Bow, mood: professional",
 * plus the side he is seen from once he is turned around ("seen from the back").
 */
export function figureDescription(pose: Pose, mood: string, seenFrom?: string): string {
  const base = `Kálmán, pose: ${pose.label}, mood: ${mood}`;
  return seenFrom === undefined ? base : `${base}, seen from the ${seenFrom}`;
}

/** The figure's description while an animation plays, e.g. "Kálmán, animation: Bow, mood: goofy". */
export function animationDescription(animationLabel: string, mood: string): string {
  return `Kálmán, animation: ${animationLabel}, mood: ${mood}`;
}
