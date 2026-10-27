/**
 * Kálmán's rig and poses: the pure maths behind the cut-out figure (spec: kalman-rig).
 *
 * Kálmán is a set of flat images (layers) on one drawing area, the *artboard*. The *rig*
 * (src/scene/kalman/rig.json) says where each layer sits at rest, which point it turns
 * around (its *pivot*), which layer it hangs from (its *parent*) and in which order the
 * layers are drawn. A *pose* (src/scene/kalman/poses.json) only says how far each layer is
 * turned or shifted from rest. `resolvePose()` combines the two into one transform matrix
 * per layer, which the SVG figure applies (src/scene/kalman/).
 *
 * Coordinates follow SVG: origin top left, x to the right, y *down*, angles in degrees,
 * positive = clockwise. No browser needed, so everything here is unit-tested.
 */

// ---------------------------------------------------------------------------------------
// 2D transform matrices
// ---------------------------------------------------------------------------------------

/** A point or a size: `[x, y]` or `[width, height]`. Like a tuple `(x, y)` in Python. */
export type Pair = readonly [number, number];

/**
 * A 2D affine transform: moves, turns and scales points in one step. The six numbers are
 * the ones SVG's `matrix(a b c d e f)` takes:
 *
 *     x' = a·x + c·y + e
 *     y' = b·x + d·y + f
 *
 * In NumPy terms it is the 3 × 3 matrix [[a, c, e], [b, d, f], [0, 0, 1]] applied to the
 * column vector [x, y, 1]; the last row never changes, so it is left out.
 */
export interface Matrix {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/** The transform that changes nothing. */
export const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/** Moves every point by `[dx, dy]`. */
export function translate([dx, dy]: Pair): Matrix {
  return { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy };
}

/** Turns every point around the origin by `degrees` (clockwise, because y points down). */
export function rotate(degrees: number): Matrix {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

/**
 * The combined transform "first `second`, then `first`", like `first @ second` in NumPy.
 * The order matters: turning then moving is not the same as moving then turning.
 */
export function multiply(first: Matrix, second: Matrix): Matrix {
  return {
    a: first.a * second.a + first.c * second.b,
    b: first.b * second.a + first.d * second.b,
    c: first.a * second.c + first.c * second.d,
    d: first.b * second.c + first.d * second.d,
    e: first.a * second.e + first.c * second.f + first.e,
    f: first.b * second.e + first.d * second.f + first.f,
  };
}

/** Combines any number of transforms; the *last* one is applied first, as in `A @ B @ C`. */
export function compose(...matrices: readonly Matrix[]): Matrix {
  return matrices.reduce(multiply, IDENTITY);
}

/**
 * Turns around `pivot` instead of the origin: move the pivot to the origin, turn, and move
 * it back. That is why a flipper turns at the shoulder and not at its image's corner.
 */
export function rotateAround(degrees: number, [px, py]: Pair): Matrix {
  return compose(translate([px, py]), rotate(degrees), translate([-px, -py]));
}

/**
 * Stretches around `pivot`: `stretch` times as tall and `1 / stretch` times as wide, so the
 * area stays the same (squash and stretch: a squashed ball gets wider). 1 changes nothing,
 * below 1 squashes, above 1 stretches.
 */
export function stretchAround(stretch: number, [px, py]: Pair): Matrix {
  const scale: Matrix = { a: 1 / stretch, b: 0, c: 0, d: stretch, e: 0, f: 0 };
  return compose(translate([px, py]), scale, translate([-px, -py]));
}

/** Where a point ends up after the transform. */
export function applyToPoint(m: Matrix, [x, y]: Pair): Pair {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}

/**
 * The matrix as an SVG `transform` value, rounded to 4 decimals, so the HTML stays short
 * and stable (floating-point noise like 1e-17 would otherwise change it on every build).
 */
export function toSvgTransform(m: Matrix): string {
  const round = (value: number) => {
    const rounded = Math.round(value * 10_000) / 10_000;
    // `Object.is(-0, 0)` is false: turn "-0" into "0" so the output never shows it.
    return String(rounded === 0 ? 0 : rounded);
  };
  return `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(round).join(' ')})`;
}

// ---------------------------------------------------------------------------------------
// Rig, pose and mood
// ---------------------------------------------------------------------------------------

/** One layer of the rig: one image, where it sits and how it may move. */
export interface RigLayer {
  /** The layer's name, e.g. `head`. Poses refer to layers by this name. */
  readonly name: string;
  /** The image file, relative to `src/assets/kalman/`, e.g. `placeholder/head.svg`. */
  readonly image: string;
  /** The image's width and height on the artboard. */
  readonly size: Pair;
  /** Where the image's top-left corner sits on the artboard at rest (absolute, not relative to the parent). */
  readonly position: Pair;
  /** The point the layer turns around, in the image's own coordinates (the neck, for the head). */
  readonly pivot: Pair;
  /** The layer it hangs from, or `null` for the one root layer (the body). */
  readonly parent: string | null;
  /** Drawing order: higher is drawn later, so in front. Independent of the parent. */
  readonly order: number;
  /** The allowed rotation from rest, `[min, max]` in degrees. It must include 0 (the rest pose). */
  readonly rotate: Pair;
  /**
   * The allowed stretch, `[min, max]`; it must include 1 (rest). Without it the layer may not
   * stretch at all.
   */
  readonly stretch?: Pair;
  /**
   * How far the layer's offset may go from rest, `[x, y]` each way (a pupil stays in its eye).
   * Without it the offset is free.
   */
  readonly shift?: Pair;
  /** True for the professional accessories (tie, glasses): only shown in the professional mood. */
  readonly accessory?: boolean;
  /** Only shown in this mood (the goofy pupils, which would peek out behind the calm eyes). */
  readonly mood?: Mood;
}

/** The whole rig: the artboard and its layers. */
export interface Rig {
  /** The artboard's width and height: the coordinate system of every position. */
  readonly artboard: Pair;
  readonly layers: readonly RigLayer[];
}

/** How one layer differs from rest in a pose. All fields are optional; missing means rest. */
export interface LayerPose {
  /** Rotation around the layer's pivot, in degrees, clockwise. */
  readonly rotate?: number;
  /** Shift from the rest position, `[dx, dy]` in artboard units. */
  readonly offset?: Pair;
  /** Squash (below 1) or stretch (above 1) around the pivot; missing means 1. */
  readonly stretch?: number;
  /**
   * How firmly the layer stays on the ground, from 0 (moves with its parent, the default) to 1:
   * it still moves with its parent, but never lower than where it stands at rest. For the feet:
   * penguins stand on bent knees hidden in the body, so when he crouches or leans the body
   * sinks and the feet stay on the ground under it, still attached; when he jumps they come
   * along. In between, the feet are pushed back up that part of the way.
   */
  readonly plant?: number;
}

/** Kálmán's two posable figures: seen from the front, and seen from the side (for swimming). */
export type Figure = 'front' | 'side';

/** Both figures, in a fixed order (the front first). */
export const FIGURES: readonly Figure[] = ['front', 'side'];

/** A named still pose. Layers it doesn't mention stay at rest. */
export interface Pose {
  /** A short id, e.g. `bow`. */
  readonly name: string;
  /** The figure the pose belongs to; poses without one are front poses. */
  readonly figure?: Figure;
  /** What the preview's button says, e.g. `Bow`. */
  readonly label: string;
  /** Per layer name, how it differs from rest. Like a Python `dict[str, LayerPose]`. */
  readonly layers: Readonly<Record<string, LayerPose>>;
}

/** Kálmán's two sides (README §2.1): the accessories only show on the professional side. */
export type Mood = 'goofy' | 'professional';

/** The pose every layer has when nothing is changed. */
export const REST_POSE: Pose = { name: 'rest', label: 'Rest', layers: {} };

/** One layer, ready to draw: what `resolvePose()` returns per layer. */
export interface ResolvedLayer {
  readonly name: string;
  /** Maps the layer's own image coordinates onto the artboard. */
  readonly matrix: Matrix;
  /** False for an accessory outside the professional mood. */
  readonly visible: boolean;
  /** Where the layer's pivot is on the artboard in this pose (for the pivot overlay and tests). */
  readonly pivotOnArtboard: Pair;
}

/**
 * Turns a rig, a pose and a mood into one drawing instruction per layer, sorted by drawing
 * order (back to front). Expects a rig that passed `validateRig()`.
 *
 * Per layer, two matrices:
 * - **local**: stretch around the own pivot, turn around it, then move to the rest position
 *   plus the offset (stretching first, so the stretch turns with the layer);
 * - **world**: the local matrix, then whatever the parent did. "What the parent did" is the
 *   parent's *movement from rest* (its world matrix with its rest position taken out), because
 *   positions are absolute: a child must move as far as its parent moved, not be placed again.
 */
export function resolvePose(rig: Rig, pose: Pose, mood: Mood): ResolvedLayer[] {
  const byName = new Map(rig.layers.map((layer) => [layer.name, layer]));
  // Movement from rest per layer, filled parents-first by the recursion below (a memo, like
  // `functools.cache` in Python). The root (no parent) has no movement to pass on: IDENTITY.
  const movements = new Map<string, Matrix>();

  function worldMatrix(layer: RigLayer): Matrix {
    const own = pose.layers[layer.name] ?? {};
    const [dx, dy] = own.offset ?? [0, 0];
    const local = compose(
      translate([layer.position[0] + dx, layer.position[1] + dy]),
      rotateAround(own.rotate ?? 0, layer.pivot),
      stretchAround(own.stretch ?? 1, layer.pivot),
    );
    // A child takes the parent's whole movement, its stretch included: it stays attached.
    const parent = layer.parent === null ? undefined : byName.get(layer.parent);
    if (parent === undefined) return local;
    const following = multiply(movementOf(parent), local);
    // A planted layer (a foot) follows its parent but doesn't go into the ground: if its lowest
    // point would be below where it is at rest, it is pushed back up (`plant` of the way).
    const plant = Math.min(1, Math.max(0, own.plant ?? 0));
    if (plant === 0) return following;
    const [w, h] = layer.size;
    const corners: Pair[] = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ];
    const lowest = Math.max(...corners.map((corner) => applyToPoint(following, corner)[1]));
    const ground = layer.position[1] + h;
    const below = lowest - ground;
    return below > 0 ? multiply(translate([0, -below * plant]), following) : following;
  }

  function movementOf(layer: RigLayer): Matrix {
    const known = movements.get(layer.name);
    if (known !== undefined) return known;
    const movement = multiply(
      worldMatrix(layer),
      translate([-layer.position[0], -layer.position[1]]),
    );
    movements.set(layer.name, movement);
    return movement;
  }

  return [...rig.layers]
    .sort((x, y) => x.order - y.order)
    .map((layer) => {
      const matrix = worldMatrix(layer);
      return {
        name: layer.name,
        matrix,
        visible:
          (layer.accessory !== true || mood === 'professional') &&
          (layer.mood === undefined || layer.mood === mood),
        pivotOnArtboard: applyToPoint(matrix, layer.pivot),
      };
    });
}

// ---------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------

/**
 * The outcome of a validation: the checked value, or every problem found at once (so one
 * run shows everything to fix). Like returning `(value, None)` or `(None, errors)` in Python,
 * but TypeScript knows which fields exist after checking `ok`.
 */
export type Validation<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

/** A plain object such as `{ ... }` from JSON (not an array, not null). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A finite number: not NaN, not Infinity, and not a string that looks like a number. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Exactly two finite numbers, e.g. `[120, 340]`. */
function isPair(value: unknown): value is Pair {
  return Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber);
}

const LAYER_FIELDS = new Set([
  'name',
  'image',
  'size',
  'position',
  'pivot',
  'parent',
  'order',
  'rotate',
  'stretch',
  'shift',
  'accessory',
  'mood',
]);

/** Checks one layer's fields and types; returns the problems, empty when it is fine. */
function layerShapeErrors(value: unknown, index: number): string[] {
  if (!isRecord(value)) return [`Layer ${index + 1} is not an object.`];
  const label =
    typeof value['name'] === 'string' ? `Layer "${value['name']}"` : `Layer ${index + 1}`;
  const errors: string[] = [];
  for (const key of Object.keys(value)) {
    if (!LAYER_FIELDS.has(key)) errors.push(`${label} has an unknown field "${key}".`);
  }
  if (typeof value['name'] !== 'string' || value['name'] === '') {
    errors.push(`${label} needs a "name" (text).`);
  }
  if (typeof value['image'] !== 'string' || value['image'] === '') {
    errors.push(`${label} needs an "image" (a file name).`);
  }
  for (const key of ['size', 'position', 'pivot', 'rotate']) {
    if (!isPair(value[key])) errors.push(`${label} needs "${key}" as two numbers.`);
  }
  if (value['stretch'] !== undefined && !isPair(value['stretch'])) {
    errors.push(`${label} needs "stretch" as two numbers, or none.`);
  }
  const shift = value['shift'];
  if (shift !== undefined && (!isPair(shift) || shift[0] < 0 || shift[1] < 0)) {
    errors.push(`${label} needs "shift" as two numbers of 0 or more, or none.`);
  }
  if (
    value['mood'] !== undefined &&
    value['mood'] !== 'goofy' &&
    value['mood'] !== 'professional'
  ) {
    errors.push(`${label} needs "mood" as "goofy" or "professional", or none.`);
  }
  const size = value['size'];
  if (isPair(size) && (size[0] <= 0 || size[1] <= 0)) {
    errors.push(`${label} needs a "size" larger than zero.`);
  }
  if (value['parent'] !== null && typeof value['parent'] !== 'string') {
    errors.push(`${label} needs "parent" as a layer name or null.`);
  }
  if (!isFiniteNumber(value['order'])) errors.push(`${label} needs "order" as a number.`);
  if (value['accessory'] !== undefined && typeof value['accessory'] !== 'boolean') {
    errors.push(`${label} needs "accessory" as true or false.`);
  }
  return errors;
}

/** Problems with how the layers relate: names, parents, roots, loops, order, images, ranges. */
function rigRelationErrors(
  layers: readonly RigLayer[],
  imageExists: (image: string) => boolean,
): string[] {
  const errors: string[] = [];
  const byName = new Map<string, RigLayer>();
  for (const layer of layers) {
    if (byName.has(layer.name))
      errors.push(`The layer name "${layer.name}" is used more than once.`);
    byName.set(layer.name, layer);
  }

  const roots = layers.filter((layer) => layer.parent === null);
  if (roots.length !== 1) {
    errors.push(`The rig needs exactly one layer without a parent; it has ${roots.length}.`);
  }
  for (const layer of layers) {
    if (layer.parent !== null && !byName.has(layer.parent)) {
      errors.push(
        `Layer "${layer.name}" has the parent "${layer.parent}", which is not in the rig.`,
      );
    }
  }

  // Follow each layer's parents upwards; meeting a layer twice on the way means a loop.
  const reported = new Set<string>();
  for (const start of layers) {
    const path: string[] = [];
    let current: RigLayer | undefined = start;
    while (current !== undefined && !path.includes(current.name)) {
      path.push(current.name);
      current = current.parent === null ? undefined : byName.get(current.parent);
    }
    if (current !== undefined) {
      const loop = path.slice(path.indexOf(current.name));
      const key = [...loop].sort().join(',');
      if (!reported.has(key)) {
        reported.add(key);
        errors.push(`The parents form a loop: ${[...loop, current.name].join(' → ')}.`);
      }
    }
  }

  const byOrder = new Map<number, string>();
  for (const layer of layers) {
    const other = byOrder.get(layer.order);
    if (other !== undefined) {
      errors.push(`Layers "${other}" and "${layer.name}" share the drawing order ${layer.order}.`);
    }
    byOrder.set(layer.order, layer.name);
  }

  for (const layer of layers) {
    if (!imageExists(layer.image)) {
      errors.push(`Layer "${layer.name}" uses the image "${layer.image}", which does not exist.`);
    }
    const [min, max] = layer.rotate;
    if (min >= max) {
      errors.push(
        `Layer "${layer.name}" has an empty or inverted rotation range [${min}, ${max}].`,
      );
    } else if (min > 0 || max < 0) {
      errors.push(
        `Layer "${layer.name}" has a rotation range [${min}, ${max}] without 0, its rest position.`,
      );
    }
    if (layer.stretch !== undefined) {
      const [low, high] = layer.stretch;
      if (low <= 0 || low >= high) {
        errors.push(
          `Layer "${layer.name}" has an empty, inverted or non-positive stretch range [${low}, ${high}].`,
        );
      } else if (low > 1 || high < 1) {
        errors.push(
          `Layer "${layer.name}" has a stretch range [${low}, ${high}] without 1, its rest size.`,
        );
      }
    }
  }
  return errors;
}

/**
 * Checks a rig read from JSON (spec: "An invalid rig fails the build checks").
 * `imageExists` answers whether an image file is there; passed in, so this stays pure.
 */
export function validateRig(
  data: unknown,
  imageExists: (image: string) => boolean,
): Validation<Rig> {
  if (!isRecord(data)) return { ok: false, errors: ['The rig is not an object.'] };
  const errors: string[] = [];
  const artboard = data['artboard'];
  if (!isPair(artboard) || artboard[0] <= 0 || artboard[1] <= 0) {
    errors.push('The rig needs an "artboard" as two numbers larger than zero.');
  }
  const layers = data['layers'];
  if (!Array.isArray(layers) || layers.length === 0) {
    errors.push('The rig needs "layers" as a list with at least one layer.');
    return { ok: false, errors };
  }
  const shapeErrors = layers.flatMap(layerShapeErrors);
  if (shapeErrors.length > 0) return { ok: false, errors: [...errors, ...shapeErrors] };

  // Every layer has the right fields and types now, so TypeScript may treat them as RigLayer.
  const typedLayers = layers as RigLayer[];
  errors.push(...rigRelationErrors(typedLayers, imageExists));
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { artboard: artboard as Pair, layers: typedLayers } };
}

/** Checks one pose against a valid rig (spec: "A pose stays within the rig's limits"). */
export function validatePose(data: unknown, rig: Rig): Validation<Pose> {
  if (!isRecord(data)) return { ok: false, errors: ['The pose is not an object.'] };
  const name = typeof data['name'] === 'string' && data['name'] !== '' ? data['name'] : undefined;
  const label = `Pose "${name ?? '?'}"`;
  const errors: string[] = [];
  if (name === undefined) errors.push('The pose needs a "name" (text).');
  if (typeof data['label'] !== 'string' || data['label'] === '') {
    errors.push(`${label} needs a "label" (text).`);
  }
  const layers = data['layers'];
  if (!isRecord(layers)) {
    errors.push(`${label} needs "layers" as an object.`);
    return { ok: false, errors };
  }

  const byName = new Map(rig.layers.map((layer) => [layer.name, layer]));
  for (const [layerName, value] of Object.entries(layers)) {
    const layer = byName.get(layerName);
    if (layer === undefined) {
      errors.push(`${label} names the layer "${layerName}", which is not in the rig.`);
      continue;
    }
    if (!isRecord(value)) {
      errors.push(`${label}, layer "${layerName}": expected an object.`);
      continue;
    }
    for (const key of Object.keys(value)) {
      if (key !== 'rotate' && key !== 'offset' && key !== 'stretch' && key !== 'plant') {
        errors.push(`${label}, layer "${layerName}" has an unknown field "${key}".`);
      }
    }
    const rotation = value['rotate'];
    if (rotation !== undefined) {
      const [min, max] = layer.rotate;
      if (!isFiniteNumber(rotation)) {
        errors.push(`${label}, layer "${layerName}": "rotate" must be a number.`);
      } else if (rotation < min || rotation > max) {
        errors.push(
          `${label} turns "${layerName}" by ${rotation}°, outside its range [${min}, ${max}].`,
        );
      }
    }
    const offset = value['offset'];
    if (offset !== undefined && !isPair(offset)) {
      errors.push(`${label}, layer "${layerName}": "offset" must be two numbers.`);
    } else if (offset !== undefined && layer.shift !== undefined) {
      const [sx, sy] = layer.shift;
      if (Math.abs(offset[0]) > sx || Math.abs(offset[1]) > sy) {
        errors.push(
          `${label} shifts "${layerName}" by [${offset[0]}, ${offset[1]}], beyond its allowed shift [${sx}, ${sy}].`,
        );
      }
    }
    errors.push(...stretchErrors(label, layer, value['stretch']));
    const plant = value['plant'];
    if (plant !== undefined && (!isFiniteNumber(plant) || plant < 0 || plant > 1)) {
      errors.push(`${label}, layer "${layerName}": "plant" must be a number from 0 to 1.`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: data as unknown as Pose };
}

/** Problems with one layer's stretch in a pose: not a number, not allowed, or out of range. */
function stretchErrors(label: string, layer: RigLayer, stretch: unknown): string[] {
  if (stretch === undefined) return [];
  if (!isFiniteNumber(stretch))
    return [`${label}, layer "${layer.name}": "stretch" must be a number.`];
  if (layer.stretch === undefined) {
    return [`${label} stretches "${layer.name}", which has no stretch range in the rig.`];
  }
  const [min, max] = layer.stretch;
  if (stretch < min || stretch > max) {
    return [
      `${label} stretches "${layer.name}" to ${stretch}, outside its range [${min}, ${max}].`,
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------------------
// Keeping a pose inside the rig's limits
// ---------------------------------------------------------------------------------------

/** `value` limited to `[min, max]`, like `numpy.clip` for one number. */
function clamp(value: number, [min, max]: Pair): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The pose with every rotation and stretch pulled back inside its layer's range (design §4).
 * An overshooting easing may ask for a little more than a layer allows; this keeps the drawn
 * figure within the rig. Offsets only have a limit on layers with a `shift` (the pupils); the
 * others stay as they are, and layers the rig doesn't have are left alone.
 */
export function clampToRig(pose: Pose, rig: Rig): Pose {
  const byName = new Map(rig.layers.map((layer) => [layer.name, layer]));
  const layers: Record<string, LayerPose> = {};
  for (const [name, own] of Object.entries(pose.layers)) {
    const layer = byName.get(name);
    if (layer === undefined) {
      layers[name] = own;
      continue;
    }
    const clamped: { rotate?: number; offset?: Pair; stretch?: number; plant?: number } = {
      ...own,
    };
    if (own.plant !== undefined) clamped.plant = clamp(own.plant, [0, 1]);
    if (own.rotate !== undefined) clamped.rotate = clamp(own.rotate, layer.rotate);
    if (own.stretch !== undefined) clamped.stretch = clamp(own.stretch, layer.stretch ?? [1, 1]);
    if (own.offset !== undefined && layer.shift !== undefined) {
      const [sx, sy] = layer.shift;
      clamped.offset = [clamp(own.offset[0], [-sx, sx]), clamp(own.offset[1], [-sy, sy])];
    }
    layers[name] = clamped;
  }
  return { ...pose, layers };
}

// ---------------------------------------------------------------------------------------
// Spinning the whole figure
// ---------------------------------------------------------------------------------------

/**
 * The middle of the figure at rest: the centre of the box around all layers. Spinning turns
 * around this point, so he stays on the stage at every angle instead of swinging out of it.
 */
export function figureCentre(rig: Rig): Pair {
  const lefts = rig.layers.map((layer) => layer.position[0]);
  const tops = rig.layers.map((layer) => layer.position[1]);
  const rights = rig.layers.map((layer) => layer.position[0] + layer.size[0]);
  const bottoms = rig.layers.map((layer) => layer.position[1] + layer.size[1]);
  // `...` spreads a list into separate arguments, like `max(*values)` in Python.
  return [
    (Math.min(...lefts) + Math.max(...rights)) / 2,
    (Math.min(...tops) + Math.max(...bottoms)) / 2,
  ];
}

/** Turns the whole figure, as one piece, by `degrees` around its centre. */
export function spinMatrix(rig: Rig, degrees: number): Matrix {
  return rotateAround(degrees, figureCentre(rig));
}

// ---------------------------------------------------------------------------------------
// Two figures: front and side
// ---------------------------------------------------------------------------------------

/** One rig per figure, like a Python dict {"front": rig, "side": rig}. */
export type Rigs = Readonly<Record<Figure, Rig>>;

/** The figure a pose belongs to (front when the pose doesn't say). */
export function figureOf(pose: Pose): Figure {
  return pose.figure ?? 'front';
}

/**
 * Checks a pose against the rig of its own figure (spec: "Poses are data", scenario "Poses
 * per figure"): first that `figure` is front or side, then everything `validatePose()` checks.
 */
export function validateFigurePose(data: unknown, rigs: Rigs): Validation<Pose> {
  const figure = (data as { figure?: unknown } | null)?.figure ?? 'front';
  if (figure !== 'front' && figure !== 'side') {
    const name = (data as { name?: unknown } | null)?.name;
    return {
      ok: false,
      errors: [`Pose "${String(name ?? '?')}" needs "figure" as "front" or "side".`],
    };
  }
  return validatePose(data, rigs[figure]);
}
