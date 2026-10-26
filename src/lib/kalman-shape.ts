/**
 * The numbers behind Kálmán's shape and colours, without any 3D library.
 *
 * build-kalman.ts turns these numbers into Three.js meshes; keeping them here as pure
 * functions means every rule ("the ear patch fades into the chest", "the back stays
 * dark") is unit-tested without a browser (README §5.4: logic outside the renderer).
 *
 * The design follows Raymond's turnaround sheet (docs/images/kalman-design/): a tall,
 * upright emperor penguin in dark navy and cream, soft golden ear patches that fade into a
 * yellow wash on the upper chest, a long slender bill and a slightly forward head.
 *
 * Coordinates: Kálmán stands on y = 0 and faces +z. Around his vertical axis, an angle
 * of 0 points to the front (his belly) and π (180°) to his back.
 */
import type { KalmanConfig } from './kalman-config';

/** A colour with red, green and blue from 0 to 1 (Three.js uses the same scale). */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** One point of the side silhouette: distance from the centre line, and height. */
export interface ProfilePoint {
  radius: number;
  y: number;
}

/**
 * The silhouette at the starting proposal, from the bottom centre to the top of the head.
 * Spinning it around the vertical axis gives body and head as one shape (a "lathe").
 * Proportions from the turnaround sheet: tall and slim, about 0.42 wide for 1.08 tall,
 * widest a little below the middle, a rounded bottom, broad shoulders, a barely visible
 * neck and a small head with a flattish crown.
 */
const BASE_PROFILE: readonly ProfilePoint[] = [
  { radius: 0, y: 0 },
  { radius: 0.11, y: 0.02 },
  { radius: 0.175, y: 0.09 },
  { radius: 0.205, y: 0.21 },
  { radius: 0.212, y: 0.35 }, // widest point
  { radius: 0.2, y: 0.52 },
  { radius: 0.172, y: 0.68 }, // shoulders
  { radius: 0.138, y: 0.79 },
  { radius: 0.112, y: 0.86 }, // neck, the narrowest point
  { radius: 0.115, y: 0.91 }, // cheeks
  { radius: 0.112, y: 0.96 },
  { radius: 0.099, y: 1.005 },
  { radius: 0.078, y: 1.04 },
  { radius: 0.045, y: 1.066 },
  { radius: 0, y: 1.076 }, // top of the head
];

/** Index of the neck in the profile: below it is body, above it is head. */
export const NECK_INDEX = 8;

/** Index of the shoulder point, where the flippers attach. */
export const SHOULDER_INDEX = 6;

/** Index of the cheek point, where the bill, eyes and ear patches sit. */
export const CHEEK_INDEX = 9;

/** Number of profile points; the "u" coordinate runs from 0 (bottom) to 1 (top) over them. */
export const PROFILE_LENGTH = BASE_PROFILE.length;

/** The point at `index` of a profile. Throws instead of returning `undefined` for a bad index. */
export function pointAt(profile: readonly ProfilePoint[], index: number): ProfilePoint {
  const point = profile[index];
  if (point === undefined) {
    throw new Error(`No profile point ${index} (the profile has ${profile.length})`);
  }
  return point;
}

/**
 * The silhouette for a config: the body stretched by height and girth, the head scaled
 * around the neck by head size. The neck takes the average of both, so it blends.
 */
export function silhouette(config: KalmanConfig): ProfilePoint[] {
  const neck = pointAt(BASE_PROFILE, NECK_INDEX);
  const neckY = neck.y * config.bodyHeight;

  return BASE_PROFILE.map((point, index) => {
    if (index < NECK_INDEX) {
      return { radius: point.radius * config.bodyGirth, y: point.y * config.bodyHeight };
    }
    if (index === NECK_INDEX) {
      return { radius: (point.radius * (config.bodyGirth + config.headSize)) / 2, y: neckY };
    }
    // Head: scaled around the neck, so a bigger head grows upwards, not into the body.
    return {
      radius: point.radius * config.headSize,
      y: neckY + (point.y - neck.y) * config.headSize,
    };
  });
}

/**
 * A smoother silhouette: `steps` points per original segment, on a curve that passes
 * through every original point (a Catmull-Rom spline, the usual way to draw a smooth line
 * through given points). With steps = 1 it returns the profile unchanged, for the faceted look.
 */
export function smoothProfile(profile: readonly ProfilePoint[], steps: number): ProfilePoint[] {
  if (steps <= 1) return profile.map((point) => ({ ...point }));
  const last = profile.length - 1;
  const at = (index: number) => pointAt(profile, clamp(index, 0, last));
  const result: ProfilePoint[] = [];
  for (let index = 0; index < last; index++) {
    const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      const point = {
        radius: Math.max(0, catmullRom(p0.radius, p1.radius, p2.radius, p3.radius, t)),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      };
      // Keep the profile strictly rising, so heights still map to one place on the body.
      const previous = result.at(-1);
      if (previous !== undefined) point.y = Math.max(point.y, previous.y + 1e-5);
      result.push(point);
    }
  }
  result.push({ ...at(last) });
  return result;
}

/** One coordinate of a Catmull-Rom curve between p1 (t = 0) and p2 (t = 1). */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  );
}

/**
 * Where a height falls along the profile, as u from 0 (bottom) to 1 (top). Works because
 * the profile only goes up; between two points it interpolates linearly.
 */
export function uAtHeight(profile: readonly ProfilePoint[], y: number): number {
  const last = profile.length - 1;
  for (let index = 1; index <= last; index++) {
    const lower = pointAt(profile, index - 1);
    const upper = pointAt(profile, index);
    if (y <= upper.y) {
      const fraction = upper.y === lower.y ? 0 : (y - lower.y) / (upper.y - lower.y);
      return (index - 1 + Math.max(0, fraction)) / last;
    }
  }
  return 1;
}

/**
 * The radius of a profile at a height, interpolated between its points. Used to place
 * flippers, the tie and the glasses on the surface instead of inside the body.
 */
export function radiusAtHeight(profile: readonly ProfilePoint[], y: number): number {
  const position = uAtHeight(profile, y) * (profile.length - 1);
  const lowerIndex = Math.floor(position);
  const lower = pointAt(profile, lowerIndex);
  const upper = pointAt(profile, Math.min(profile.length - 1, lowerIndex + 1));
  return lower.radius + (upper.radius - lower.radius) * (position - lowerIndex);
}

/**
 * How far from the centre line the flippers hang: just outside the shoulder surface.
 * (A pivot inside the body would make even the top of the flipper look like it needs
 * room, and the flippers would stick out like arms.)
 */
export function flipperPivotRadius(profile: readonly ProfilePoint[]): number {
  return pointAt(profile, SHOULDER_INDEX).radius + 0.006;
}

/**
 * How far a flipper must swing out from the shoulder (radians) so that it hangs clear of
 * the body all along its length: the body widens below the shoulders, and a flipper hanging
 * straight down would disappear inside the belly.
 */
export function flipperSplay(profile: readonly ProfilePoint[], length: number): number {
  const pivotRadius = flipperPivotRadius(profile);
  const shoulder = pointAt(profile, SHOULDER_INDEX);
  const clearance = 0.004; // just clear of the body: in the design the flippers hang close along the flanks
  let needed = 0;
  // Check points along the flipper; each one needs enough sideways room at its height.
  for (let step = 1; step <= 10; step++) {
    const distance = (length * step) / 10;
    const y = shoulder.y - distance;
    const room = radiusAtHeight(profile, Math.max(0, y)) + clearance - pivotRadius;
    needed = Math.max(needed, room / distance);
  }
  return Math.asin(clamp(needed, 0, 0.9));
}

/** The u value of a profile index. */
function uOf(index: number): number {
  return index / (PROFILE_LENGTH - 1);
}

/** A bell curve: 1 at 0, falling to about 0.37 at `width`. */
function bell(distance: number, width: number): number {
  return Math.exp(-((distance / width) ** 2));
}

/**
 * 0 below `edge0`, 1 above `edge1`, and a smooth S-curve in between
 * (the classic "smoothstep" from graphics programming).
 */
function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Limits a value to the range from `min` to `max`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * How much the belly pushes the body outwards at a point: 1 means no change. Only the
 * front bulges, most at the lower belly, scaled by the belly-roundness parameter.
 */
export function bellyFactor(u: number, angle: number, roundness: number): number {
  const frontness = Math.max(0, Math.cos(angle)); // 1 at the front, 0 at the sides and back
  const bellyHeight = bell(u - uOf(3.5), 0.2);
  return 1 + 0.16 * roundness * frontness * bellyHeight;
}

/**
 * The upright posture of the turnaround's side view: the back stays straight while the
 * head and neck sit a little forward. Returns how far a point moves forward (towards +z).
 */
export function postureShift(u: number): number {
  return 0.03 * smoothstep(uOf(SHOULDER_INDEX), uOf(CHEEK_INDEX + 1), u);
}

/**
 * The head is longer front-to-back than it is wide, running into the bill.
 * Returns how much to stretch a point's depth (z) at height u: 1 below the neck.
 */
export function headDepthScale(u: number): number {
  return 1 + 0.18 * smoothstep(uOf(NECK_INDEX), uOf(CHEEK_INDEX + 1), u);
}

/** Ear-patch centre: on the side of the head, behind and below the eye. */
export const EAR_POINT = { u: uOf(CHEEK_INDEX + 0.2), angle: 1.75 }; // behind the eye, about 100°
/** Where the patch's fading tail ends: the upper chest, near the front. */
export const CHEST_POINT = { u: uOf(NECK_INDEX - 1.5), angle: 0.35 };
const EAR_U = EAR_POINT.u;
const EAR_ANGLE = EAR_POINT.angle;
const CHEST_U = CHEST_POINT.u;
const CHEST_ANGLE = CHEST_POINT.angle;

/**
 * How strongly the golden ear patch colours a point, from 0 (not at all) to 1.
 * Full at the ear, then a tail runs down and forwards to the upper chest; `spread` sets
 * how far down that tail reaches before it has faded out (0: the patch stays at the ear).
 * Left and right ear are mirror images, hence the absolute angle.
 */
export function earPatchWeight(u: number, angle: number, spread: number): number {
  const side = Math.abs(angle);
  // A crescent: taller than it is wide, behind the eye and running down the side of the neck.
  const ear = bell(u - EAR_U, 0.11) * bell(side - EAR_ANGLE, 0.38);

  // The tail: project the point onto the line from ear to chest, in (u, angle) space.
  // The u axis is scaled up because a step in u is a much larger step on the body.
  const U_SCALE = 6;
  const dx = (CHEST_U - EAR_U) * U_SCALE;
  const dy = CHEST_ANGLE - EAR_ANGLE;
  const px = (u - EAR_U) * U_SCALE;
  const py = side - EAR_ANGLE;
  const along = clamp((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1); // 0 at the ear, 1 at the chest
  const distance = Math.hypot(px - along * dx, py - along * dy);
  const reach = Math.max(spread, 0.01);
  const fade = clamp(1 - along / reach, 0, 1);
  const tail = bell(distance, 0.4) * fade;

  return clamp(Math.max(ear, tail), 0, 1);
}

/**
 * The pale-yellow wash across the upper chest, just below the dark throat, fading down
 * into the cream belly. Its depth follows the spread parameter; from 0 to 1.
 */
export function chestWashWeight(u: number, angle: number, spread: number): number {
  const top = uOf(NECK_INDEX - 0.4); // where the belly starts below the throat
  const depth = 0.04 + 0.12 * spread; // how far down (in u) it fades out
  const vertical = smoothstep(top - depth, top - 0.01, u);
  const across = 1 - smoothstep(0.75, 1.15, Math.abs(angle));
  return u <= top ? vertical * across : 0;
}

/**
 * True where the cream belly is: the front of the body, from the upper chest down.
 * The chin and throat stay dark, as in a real emperor penguin (and unlike Tux).
 */
export function isBelly(u: number, angle: number): boolean {
  const belowChin = u < uOf(NECK_INDEX - 0.4) && u > uOf(0.5);
  // About 69° to either side: the flanks stay dark, so even from the front he has dark
  // edges. 69° sits away from every facet centre in the faceted look, so no facet flips
  // between dark and light from row to row.
  return belowChin && Math.abs(angle) < 1.2;
}

/**
 * The fixed colours that make him an emperor penguin, taken from the turnaround sheet.
 * Not parameters on purpose: no setting can turn him into another bird.
 */
export const PLUMAGE = {
  dark: { r: 0.17, g: 0.205, b: 0.3 }, // deep navy blue-grey, not flat black
  light: { r: 0.95, g: 0.935, b: 0.89 }, // warm cream
  billDark: { r: 0.12, g: 0.13, b: 0.17 },
  billOrange: { r: 0.95, g: 0.56, b: 0.2 },
  billPink: { r: 0.93, g: 0.56, b: 0.55 },
  feet: { r: 0.36, g: 0.38, b: 0.42 }, // slate grey
  flipperEdge: { r: 0.8, g: 0.82, b: 0.86 }, // the pale inner edge of the flippers
  eye: { r: 0.05, g: 0.05, b: 0.07 },
  eyeHighlight: { r: 1, g: 1, b: 1 },
} as const satisfies Record<string, Rgb>;

/** Mixes two colours: t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

/**
 * Converts hue (degrees), saturation and lightness (0 to 1) to RGB. HSL is easier to
 * reason about for the ear patch: the hue slider moves between gold and orange.
 */
export function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = (((hue % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));
  const [r, g, b] =
    sector < 1
      ? [chroma, x, 0]
      : sector < 2
        ? [x, chroma, 0]
        : sector < 3
          ? [0, chroma, x]
          : sector < 4
            ? [0, x, chroma]
            : sector < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = lightness - chroma / 2;
  return { r: r + m, g: g + m, b: b + m };
}

/** Converts RGB back to hue (degrees), saturation and lightness. Used to check colours in tests. */
export function rgbToHsl({ r, g, b }: Rgb): { hue: number; saturation: number; lightness: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === r
      ? 60 * (((g - b) / delta) % 6)
      : max === g
        ? 60 * ((b - r) / delta + 2)
        : 60 * ((r - g) / delta + 4);
  return { hue: (hue + 360) % 360, saturation, lightness };
}

/**
 * The ear-patch colour for a config: a soft golden orange, as in the turnaround sheet.
 * Intensity makes it more or less vivid, but never mixes in the navy: mixing would pull
 * the hue towards brown, and the patch must stay golden at every setting.
 */
export function earPatchColour(config: KalmanConfig): Rgb {
  const intensity = config.earPatchIntensity;
  return hslToRgb(config.earPatchHue, 0.45 + 0.43 * intensity, 0.55 + 0.12 * intensity);
}

/** The chest wash: the same hue as the ear patch, but pale. */
function chestWashColour(config: KalmanConfig): Rgb {
  return hslToRgb(config.earPatchHue + 5, 0.75, 0.74);
}

/** The plumage colour at a point of the body: navy or cream, with the patch and wash blended in. */
export function bodyColourAt(u: number, angle: number, config: KalmanConfig): Rgb {
  const belly = isBelly(u, angle);
  let colour: Rgb = belly ? PLUMAGE.light : PLUMAGE.dark;
  if (belly) {
    const wash = chestWashWeight(u, angle, config.earPatchSpread) * config.earPatchIntensity;
    colour = mix(colour, chestWashColour(config), wash);
  }
  // Sharpen the soft weight into a clear patch with a short fade at its edge.
  const patch = smoothstep(0.12, 0.6, earPatchWeight(u, angle, config.earPatchSpread));
  return mix(colour, earPatchColour(config), patch);
}

/** The stripe on the lower mandible: orange at the base, pink towards the tip (t from 0 to 1). */
export function billStripeColour(t: number): Rgb {
  return mix(PLUMAGE.billOrange, PLUMAGE.billPink, clamp(t, 0, 1));
}

/** Radial segments per detail level, for the faceted (low-poly) look: large flat faces. */
const FACETED_SEGMENTS = [7, 9, 12, 16] as const;
/** Radial segments per detail level, for the smooth look: enough faces for a round body. */
const SMOOTH_SEGMENTS = [16, 22, 28, 34] as const;

/** How many faces go around the body at a detail level (0 to 3), for either look. */
export function facetSegments(level: number, faceted: boolean): number {
  const table = faceted ? FACETED_SEGMENTS : SMOOTH_SEGMENTS;
  return table[clamp(Math.round(level), 0, table.length - 1)] ?? table[1];
}

/** Extra profile points per original segment: none for the faceted look, more for smooth. */
export function profileSteps(level: number, faceted: boolean): number {
  return faceted ? 1 : 2 + clamp(Math.round(level), 0, 3);
}

/**
 * The flipper angle during the swim preview, in radians: a smooth up-and-down stroke
 * of ±amplitude degrees, `speed` full strokes per second (a sine wave, like numpy.sin).
 */
export function strokeAngle(timeSeconds: number, amplitudeDegrees: number, speed: number): number {
  const amplitude = (amplitudeDegrees * Math.PI) / 180;
  return amplitude * Math.sin(2 * Math.PI * speed * timeSeconds);
}
