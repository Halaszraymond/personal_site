/**
 * Turning Kálmán around like on a turntable, with the drawn views from the design sheet
 * (front, side, back, other side).
 *
 * A 2D drawing can only show the angles that were drawn, so in between two views this fakes
 * the turn: the current view gets narrower (as a turning body would look), and halfway the
 * next view fades in on top. Pure maths, unit-tested; the preview applies the result to the SVG.
 */
import { multiply, translate, type Matrix, type Mood, type Pair } from './kalman-rig';

/** One drawn view and the angle it shows Kálmán from (0 = front, 180 = back). */
export interface TurntableView {
  readonly name: string;
  readonly angle: number;
}

/** How one view is drawn at a given angle. */
export interface ViewFrame {
  readonly name: string;
  /** 0 = invisible, 1 = fully visible. */
  readonly opacity: number;
  /** Horizontal squeeze: 1 = normal width, smaller = narrower. */
  readonly scaleX: number;
}

/** How narrow a view gets halfway to the next one (0.35 → 65 % of its width). */
const SQUEEZE = 0.35;
/** The part of the way between two views over which they crossfade, around halfway: short, so
 * the moment with two drawings on top of each other passes quickly. */
const FADE_BAND = 0.12;

/** Any angle as 0–360, so −90 and 270 are the same. Like `angle % 360` in Python. */
export function normaliseAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** 0 below `from`, 1 above `to`, and a smooth S-curve in between ("smoothstep"). */
function smoothStep(from: number, to: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/**
 * The views to draw at `degrees`: one view exactly at a drawn angle, two while crossfading.
 * `views` must have at least one view, with different angles.
 */
export function turntableFrame(views: readonly TurntableView[], degrees: number): ViewFrame[] {
  const angle = normaliseAngle(degrees);
  const sorted = [...views].sort((a, b) => a.angle - b.angle);
  const first = sorted[0];
  if (first === undefined) return [];
  // The last view at or before this angle, and the one after it (wrapping round to the first).
  const previousIndex = sorted.findLastIndex((view) => view.angle <= angle);
  const previous = sorted[previousIndex] ?? sorted[sorted.length - 1] ?? first;
  const next = sorted[(previousIndex + 1) % sorted.length] ?? first;
  const span = normaliseAngle(next.angle - previous.angle) || 360;
  // How far we are from `previous` to `next`: 0 = at previous, 1 = at next.
  const t = normaliseAngle(angle - previous.angle) / span;
  if (t === 0 || previous === next) return [{ name: previous.name, opacity: 1, scaleX: 1 }];

  // Narrowest halfway, back to full width at both ends: a sine hump.
  const scaleX = 1 - SQUEEZE * Math.sin(Math.PI * t);
  const nextOpacity = smoothStep(0.5 - FADE_BAND / 2, 0.5 + FADE_BAND / 2, t);
  // The outgoing view stays solid underneath while the next one fades in on top of it, so the
  // background never shows through two half-transparent drawings. Listed back to front.
  return [
    { name: previous.name, opacity: nextOpacity < 1 ? 1 : 0, scaleX },
    { name: next.name, opacity: nextOpacity, scaleX },
  ].filter((frame) => frame.opacity > 0);
}

/** Squeezes horizontally around the vertical line x = `centreX`, then places the image at `position`. */
export function viewMatrix(scaleX: number, centreX: number, position: Pair): Matrix {
  const squeeze: Matrix = { a: scaleX, b: 0, c: 0, d: 1, e: 0, f: 0 };
  return multiply(
    multiply(translate([centreX, 0]), multiply(squeeze, translate([-centreX, 0]))),
    translate(position),
  );
}

/** One drawn view as stored in turntable.json: its angle and an image per mood. */
export interface TurntableEntry extends TurntableView {
  readonly images: Readonly<Record<Mood, PlacedImage>>;
}

/** An image placed on the artboard, like a rig layer at rest. */
export interface PlacedImage {
  readonly image: string;
  readonly size: Pair;
  readonly position: Pair;
}

const isPair = (value: unknown): value is Pair =>
  Array.isArray(value) && value.length === 2 && value.every((v) => Number.isFinite(v));

function isPlacedImage(value: unknown): value is PlacedImage {
  if (typeof value !== 'object' || value === null) return false;
  const { image, size, position } = value as Record<string, unknown>;
  return typeof image === 'string' && image !== '' && isPair(size) && isPair(position);
}

/**
 * Checks turntable.json: a list of views with a unique name and angle (0–360), each with a
 * placed image for both moods. Returns the problems; empty when it is fine.
 */
export function turntableErrors(data: unknown): string[] {
  const views = (data as { views?: unknown } | null)?.views;
  if (!Array.isArray(views) || views.length === 0)
    return ['The turntable needs a list of "views".'];
  const errors: string[] = [];
  const names = new Set<string>();
  const angles = new Set<number>();
  views.forEach((view: unknown, index) => {
    const { name, angle, images } = (view ?? {}) as Record<string, unknown>;
    const label = typeof name === 'string' ? `View "${name}"` : `View ${index + 1}`;
    if (typeof name !== 'string' || name === '') errors.push(`${label} needs a "name".`);
    else if (names.has(name)) errors.push(`${label} is listed twice.`);
    else names.add(name);
    if (typeof angle !== 'number' || angle < 0 || angle >= 360) {
      errors.push(`${label} needs an "angle" from 0 up to 360.`);
    } else if (angles.has(angle))
      errors.push(`${label} shares its angle ${angle} with another view.`);
    else angles.add(angle);
    const byMood = (images ?? {}) as Record<string, unknown>;
    for (const mood of ['goofy', 'professional']) {
      if (!isPlacedImage(byMood[mood])) {
        errors.push(`${label} needs a "${mood}" image with "image", "size" and "position".`);
      }
    }
  });
  return errors;
}
