/**
 * Kálmán's drawn poses: whole drawings of him in one pose, shown instead of his layers at a
 * keyframe (spec: kalman-animation, "An animation can show a drawn pose"; kalman-rig, "Drawn
 * poses come from the design images"; kalman-animation-feel design §7–§8).
 *
 * Some poses can't be made by turning flat layers. From the front a bow tips the head towards
 * the viewer, so we see the top of his head: that needs a drawing. `npm run cut:kalman` cuts
 * these drawings from Raymond's images and writes src/scene/kalman/drawn-poses.json, one
 * image per mood, placed on the artboard exactly like the front figure. This file only checks
 * that data; the figure draws it and the player fades it in and out.
 */
import type { Figure, Mood } from './kalman-rig';
import { isPlacedImage, type PlacedImage } from './kalman-turntable';

/** One drawn pose: its name (used by keyframes), its figure, and a placed image per mood. */
export interface DrawnPose {
  readonly name: string;
  /** The figure it replaces while it shows: an animation can only use its own figure's. */
  readonly figure: Figure;
  readonly images: Readonly<Record<Mood, PlacedImage>>;
}

/** The moods every drawn pose needs an image for, like the turntable views. */
const MOODS: readonly Mood[] = ['goofy', 'professional'];

/** Checks drawn-poses.json: every problem at once, empty when it is fine. */
export function drawnPoseErrors(data: unknown): string[] {
  const poses = (data as { poses?: unknown } | null)?.poses;
  if (!Array.isArray(poses)) return ['The drawn poses need a list of "poses".'];
  const errors: string[] = [];
  const names = new Set<string>();
  poses.forEach((value: unknown, index) => {
    const { name, figure, images } = (value ?? {}) as {
      name?: unknown;
      figure?: unknown;
      images?: unknown;
    };
    const label = typeof name === 'string' ? `Drawn pose "${name}"` : `Drawn pose ${index + 1}`;
    if (typeof name !== 'string' || name === '') errors.push(`${label} needs a "name".`);
    else if (names.has(name)) errors.push(`${label} is listed twice.`);
    else names.add(name);
    if (figure !== 'front' && figure !== 'side') {
      errors.push(`${label} needs "figure" as "front" or "side".`);
    }
    const byMood = (images ?? {}) as Record<string, unknown>;
    for (const mood of MOODS) {
      if (!isPlacedImage(byMood[mood])) {
        errors.push(`${label} needs a "${mood}" image with "image", "size" and "position".`);
      }
    }
  });
  return errors;
}
