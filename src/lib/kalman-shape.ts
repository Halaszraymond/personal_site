/**
 * The numbers behind Kálmán's shape and colours, without any 3D library.
 *
 * build-kalman.ts turns these numbers into Three.js meshes; keeping them here as pure
 * functions means every rule ("the ear patch fades towards the chest", "the back stays
 * black") is unit-tested without a browser (README §5.4: logic outside the renderer).
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
 * Proportions follow a standing emperor penguin: tall and slender (about 0.42 wide for
 * 1 tall), widest low on the belly, tapering shoulders, a slight neck and a small head.
 * Not the round egg with a ball on top of cartoon penguins. The head has extra points,
 * so the ear patches get enough faces to show.
 */
const BASE_PROFILE: readonly ProfilePoint[] = [
  { radius: 0, y: 0 },
  { radius: 0.11, y: 0.012 },
  { radius: 0.175, y: 0.07 },
  { radius: 0.2, y: 0.18 }, // widest point: the lower belly
  { radius: 0.195, y: 0.32 },
  { radius: 0.175, y: 0.46 },
  { radius: 0.14, y: 0.59 }, // shoulders
  { radius: 0.112, y: 0.67 },
  { radius: 0.1, y: 0.72 }, // neck, the narrowest point
  { radius: 0.108, y: 0.77 }, // cheeks
  { radius: 0.107, y: 0.82 },
  { radius: 0.096, y: 0.865 },
  { radius: 0.075, y: 0.905 },
  { radius: 0.042, y: 0.935 },
  { radius: 0, y: 0.948 }, // top of the head
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
  const clearance = 0.012; // a small gap, so the flipper reads as a separate part
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
  const bellyHeight = bell(u - uOf(3.5), 0.18); // centred between the widest points
  return 1 + 0.18 * roundness * frontness * bellyHeight;
}

/** Ear-patch centre: on the side of the head, behind and below the eye. */
export const EAR_POINT = { u: uOf(CHEEK_INDEX + 0.6), angle: 1.45 }; // about 83° from the front
/** Where the patch's fading tail ends: the upper chest, near the front. */
export const CHEST_POINT = { u: uOf(NECK_INDEX - 1.5), angle: 0.35 };
const EAR_U = EAR_POINT.u;
const EAR_ANGLE = EAR_POINT.angle;
const CHEST_U = CHEST_POINT.u;
const CHEST_ANGLE = CHEST_POINT.angle;

/**
 * How strongly the golden-orange ear patch colours a point, from 0 (not at all) to 1.
 * Full at the ear, then a tail runs down and forwards to the upper chest; `spread` sets
 * how far down that tail reaches before it has faded out (0: the patch stays at the ear).
 * Left and right ear are mirror images, hence the absolute angle.
 */
export function earPatchWeight(u: number, angle: number, spread: number): number {
  const side = Math.abs(angle);
  const ear = bell(u - EAR_U, 0.085) * bell(side - EAR_ANGLE, 0.6);

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
 * True where the white belly is: the front of the body, from the upper chest down.
 * The chin and throat stay black, as in a real emperor penguin (and unlike Tux).
 */
export function isBelly(u: number, angle: number): boolean {
  const belowChin = u < uOf(NECK_INDEX - 0.4) && u > uOf(0.5);
  // About 69° to either side: the flanks stay black, so even from the front he has dark edges.
  // 69° is chosen away from every facet centre (at 7, 9, 12 and 16 segments), so no facet
  // flips between black and white from row to row.
  return belowChin && Math.abs(angle) < 1.2;
}

/** The fixed colours that make him an emperor penguin: not parameters on purpose. */
export const PLUMAGE = {
  black: { r: 0.07, g: 0.078, b: 0.09 },
  white: { r: 0.955, g: 0.955, b: 0.94 },
  billOrange: { r: 0.94, g: 0.5, b: 0.13 },
  billPink: { r: 0.91, g: 0.51, b: 0.61 },
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

/** The ear-patch colour for a config: golden-orange, saturated, mid-light. */
export function earPatchColour(config: KalmanConfig): Rgb {
  return hslToRgb(config.earPatchHue, 0.95, 0.52);
}

/** The plumage colour at a point of the body: black or white, with the ear patch blended in. */
export function bodyColourAt(u: number, angle: number, config: KalmanConfig): Rgb {
  const base = isBelly(u, angle) ? PLUMAGE.white : PLUMAGE.black;
  // Sharpen the soft weight into a clear patch with a short fade at its edge: a plain
  // blend left most faces half-mixed with black, which read as dull ochre.
  const patch = smoothstep(0.1, 0.55, earPatchWeight(u, angle, config.earPatchSpread));
  const weight = patch * config.earPatchIntensity;
  return mix(base, earPatchColour(config), weight);
}

/** The stripe on the lower mandible: orange at the base, pink towards the tip (t from 0 to 1). */
export function billStripeColour(t: number): Rgb {
  return mix(PLUMAGE.billOrange, PLUMAGE.billPink, clamp(t, 0, 1));
}

/** Radial segments per faceting level: fewer segments means larger, flatter faces. */
const SEGMENTS_PER_LEVEL = [7, 9, 12, 16] as const;

/** How many faces go around the body at a faceting level (0 to 3). */
export function facetSegments(level: number): number {
  return SEGMENTS_PER_LEVEL[clamp(Math.round(level), 0, SEGMENTS_PER_LEVEL.length - 1)] ?? 9;
}

/**
 * The flipper angle during the swim preview, in radians: a smooth up-and-down stroke
 * of ±amplitude degrees, `speed` full strokes per second (a sine wave, like numpy.sin).
 */
export function strokeAngle(timeSeconds: number, amplitudeDegrees: number, speed: number): number {
  const amplitude = (amplitudeDegrees * Math.PI) / 180;
  return amplitude * Math.sin(2 * Math.PI * speed * timeSeconds);
}
