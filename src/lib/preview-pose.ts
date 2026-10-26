/**
 * The pose the Kálmán preview shows, worked out from its controls (spec: kalman-preview).
 *
 * The preview starts from a named pose (the last pose button pressed) and lets the sliders
 * override each layer's rotation. Offsets aren't on sliders, so they stay as the named pose
 * has them. Once a slider differs from the named pose, the result is no longer that pose but
 * a "custom" one, which is what "Copy pose" exports. Pure, so it is unit-tested.
 */
import type { LayerPose, Pose } from './kalman-rig';

/** The name and label a pose gets once the sliders have changed it. */
export const CUSTOM_POSE = { name: 'custom', label: 'Custom' } as const;

/**
 * The named pose `base` with every layer's rotation taken from `rotations` (layer name →
 * degrees). Layers at 0° without an offset are left out, so the JSON stays as short as the
 * poses in poses.json.
 */
export function poseFromControls(base: Pose, rotations: Readonly<Record<string, number>>): Pose {
  const names = new Set([...Object.keys(base.layers), ...Object.keys(rotations)]);
  const layers: Record<string, LayerPose> = {};
  let changed = false;
  for (const name of names) {
    const offset = base.layers[name]?.offset;
    const rotate = rotations[name] ?? base.layers[name]?.rotate ?? 0;
    if (rotate !== (base.layers[name]?.rotate ?? 0)) changed = true;
    // Build the layer entry with only the fields that matter, in a fixed order.
    const entry: { rotate?: number; offset?: LayerPose['offset'] } = {};
    if (rotate !== 0) entry.rotate = rotate;
    if (offset !== undefined) entry.offset = offset;
    if (entry.rotate !== undefined || entry.offset !== undefined) layers[name] = entry;
  }
  return changed ? { ...CUSTOM_POSE, layers } : { name: base.name, label: base.label, layers };
}

/** The pose as JSON for "Copy pose", indented like poses.json (`json.dumps(pose, indent=2)`). */
export function poseToJson(pose: Pose): string {
  return JSON.stringify(pose, null, 2);
}

/** The figure's description for screen readers, e.g. "Kálmán, pose: Bow, mood: professional". */
export function figureDescription(pose: Pose, mood: string): string {
  return `Kálmán, pose: ${pose.label}, mood: ${mood}`;
}
