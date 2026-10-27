/**
 * Cutting Kálmán's layers and turntable views out of Raymond's design images.
 *
 * Pure logic on plain pixel arrays, so it is unit-tested on tiny made-up images; the runner
 * `scripts/cut-kalman-layers.ts` reads and writes the real files with sharp (kalman-rig
 * design §5). An image here is what sharp calls "raw": every pixel's red, green and blue
 * values one after the other, row by row, like a NumPy array of shape (height, width, 3)
 * flattened into one list.
 */

/** A raw image: `channels` values per pixel (3 = RGB, 4 = RGBA), row by row. */
export interface RawImage {
  readonly width: number;
  readonly height: number;
  readonly channels: number;
  readonly data: Uint8Array;
}

/** One value from 0 (transparent) to 1 (solid) per pixel, row by row. */
export type AlphaMap = Float32Array;

/** A rectangle of pixels: its top-left corner and its size. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The red, green and blue value of pixel `i` (counted row by row). */
function rgbAt(image: RawImage, i: number): [number, number, number] {
  const o = i * image.channels;
  return [image.data[o] ?? 0, image.data[o + 1] ?? 0, image.data[o + 2] ?? 0];
}

/** How near-white counts as background: every channel at least `minLevel`, and nearly grey. */
export interface BackgroundOptions {
  readonly minLevel: number;
  readonly maxSpread: number;
}

/** Tuned on the Gemini images: their white background is never below 233 or tinted by more than 15. */
const DEFAULT_BACKGROUND: BackgroundOptions = { minLevel: 233, maxSpread: 15 };

/**
 * Marks the background: 1 for background pixels, 0 for the figure. A flood fill from every
 * edge pixel through near-white pixels, like the paint-bucket tool. The white belly stays
 * figure, because the darker edge of the body closes it off from the outside.
 */
export function findBackground(
  image: RawImage,
  options: BackgroundOptions = DEFAULT_BACKGROUND,
): Uint8Array {
  const { width: w, height: h } = image;
  const isNearWhite = (i: number) => {
    const [r, g, b] = rgbAt(image, i);
    const low = Math.min(r, g, b);
    return low >= options.minLevel && Math.max(r, g, b) - low <= options.maxSpread;
  };
  const background = new Uint8Array(w * h);
  // A list used as a stack (last in, first out), like a Python list with append/pop.
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length > 0) {
    const i = stack.pop() ?? 0;
    if (background[i] === 1 || !isNearWhite(i)) continue;
    background[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  return background;
}

/** True when pixel `i` has a background pixel directly left, right, above or below it. */
function touchesBackground(background: Uint8Array, width: number, i: number): boolean {
  const x = i % width;
  return (
    (x > 0 && background[i - 1] === 1) ||
    (x < width - 1 && background[i + 1] === 1) ||
    background[i - width] === 1 ||
    background[i + width] === 1
  );
}

/**
 * The figure's alpha: 0 on the background, 1 inside the figure, and on the outline a value
 * from how far the pixel is from white, so the edge is soft instead of jagged. `softness` is
 * how many levels below white count as fully solid; edge pixels never go below 0.15.
 */
export function figureAlpha(image: RawImage, background: Uint8Array, softness = 60): AlphaMap {
  const alpha = new Float32Array(image.width * image.height);
  for (let i = 0; i < alpha.length; i++) {
    if (background[i] === 1) continue;
    if (!touchesBackground(background, image.width, i)) {
      alpha[i] = 1;
      continue;
    }
    const darkest = Math.min(...rgbAt(image, i));
    alpha[i] = Math.min(1, Math.max(0.15, (255 - darkest) / softness));
  }
  return alpha;
}

/**
 * How dark each pixel is: 1 at or below `dark` brightness, 0 at or above `light`, a straight
 * line in between (brightness as the eye weighs it: green counts most, blue least). The side
 * feet are dark grey and the belly feathers over them white, so this tells them apart, with
 * a soft transition on the feathered edge instead of a hard line.
 */
export function darknessMap(image: RawImage, dark = 110, light = 160): AlphaMap {
  const map = new Float32Array(image.width * image.height);
  for (let i = 0; i < map.length; i++) {
    const [r, g, b] = rgbAt(image, i);
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    map[i] = Math.min(1, Math.max(0, (light - brightness) / (light - dark)));
  }
  return map;
}

/**
 * `alpha` with everything outside `bounds` set to 0, like masking a NumPy array. Used to keep
 * a difference to the eyes: the edits without pupils also carry a little noise elsewhere.
 */
export function restrictAlpha(alpha: AlphaMap, width: number, bounds: PixelBounds): AlphaMap {
  const kept = new Float32Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    const x = i % width;
    const y = (i - x) / width;
    const inside = x >= bounds[0] && y >= bounds[1] && x <= bounds[2] && y < bounds[3];
    kept[i] = inside ? (alpha[i] ?? 0) : 0;
  }
  return kept;
}

/**
 * `base` with `other` mixed in where `alpha` says so (0 = all `base`, 1 = all `other`). For the
 * head with empty eyes: the original everywhere, and the edit only where its pupils were, so
 * the head keeps exactly the original's colours and no seam shows at the neck.
 */
export function blendImages(base: RawImage, other: RawImage, alpha: AlphaMap): RawImage {
  assertSameSize(base, other, 'blendImages');
  const data = new Uint8Array(base.width * base.height * 3);
  for (let i = 0; i < base.width * base.height; i++) {
    const a = alpha[i] ?? 0;
    const from = rgbAt(base, i);
    const to = rgbAt(other, i);
    for (let c = 0; c < 3; c++) {
      data[i * 3 + c] = Math.round((from[c] ?? 0) * (1 - a) + (to[c] ?? 0) * a);
    }
  }
  return { width: base.width, height: base.height, channels: 3, data };
}

/** Stops when two images that must line up pixel for pixel don't have the same size. */
export function assertSameSize(a: RawImage, b: RawImage, what: string): void {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `${what}: the images must be the same size to line up, but they are ` +
        `${a.width}×${a.height} and ${b.width}×${b.height}.`,
    );
  }
}

/**
 * Where `b` differs from `a`: 0 where they are the same, rising to 1 where the biggest channel
 * difference is `threshold + range` or more. Used for the professional extras, because the
 * professional image is the goofy one with only the tie, the glasses and the eyes changed.
 */
export function differenceAlpha(a: RawImage, b: RawImage, threshold = 14, range = 26): AlphaMap {
  assertSameSize(a, b, 'differenceAlpha');
  const alpha = new Float32Array(a.width * a.height);
  for (let i = 0; i < alpha.length; i++) {
    const pa = rgbAt(a, i);
    const pb = rgbAt(b, i);
    const biggest = Math.max(...pa.map((value, k) => Math.abs(value - (pb[k] ?? 0))));
    alpha[i] = Math.min(1, Math.max(0, (biggest - threshold) / range));
  }
  return alpha;
}

/**
 * Per row from `fromRow` up to (not including) `toRow`: the first background column after the
 * figure, searched from the image's left edge towards `centreX` (or from the right edge for
 * `side: 'right'`). That is the gap between a flipper and the body; rows without one get
 * `undefined`. Like a dict {row: column} in Python.
 */
export function gapPerRow(
  background: Uint8Array,
  width: number,
  fromRow: number,
  toRow: number,
  side: 'left' | 'right',
  centreX: number,
): Map<number, number | undefined> {
  const gaps = new Map<number, number | undefined>();
  const start = side === 'left' ? 0 : width - 1;
  const step = side === 'left' ? 1 : -1;
  for (let y = fromRow; y < toRow; y++) {
    let seenFigure = false;
    let gap: number | undefined;
    for (let x = start; x !== centreX; x += step) {
      const isBackground = background[y * width + x] === 1;
      if (!isBackground) seenFigure = true;
      else if (seenFigure) {
        gap = x;
        break;
      }
    }
    gaps.set(y, gap);
  }
  return gaps;
}

/** 0 above `from`, 1 below `to`, a straight line in between. For the soft joints. */
export function ramp(from: number, to: number): (row: number) => number {
  return (row) => Math.min(1, Math.max(0, (row - from) / (to - from)));
}

/** Which pixels belong to a part, and how much of each (1 = all, 0.5 = half faded). */
export type PartRegion = (x: number, y: number) => number;

/** A part cut out: its pixels as RGBA (4 values per pixel) and where it sat in the image. */
export interface CutPart {
  readonly rgba: Uint8Array;
  readonly box: Box;
}

/**
 * Cuts one part: every pixel where `region` × `alpha` is above 0, taken from `image`, cropped
 * to the smallest box around them. Returns undefined when the region is empty.
 */
export function cutPart(image: RawImage, alpha: AlphaMap, region: PartRegion): CutPart | undefined {
  const { width: w, height: h } = image;
  const kept = new Float32Array(w * h);
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < kept.length; i++) {
    const x = i % w;
    const y = (i - x) / w;
    const value = (alpha[i] ?? 0) * region(x, y);
    if (value <= 0) continue;
    kept[i] = value;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (x1 < 0) return undefined;
  const box = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const rgba = new Uint8Array(box.width * box.height * 4);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const o = ((y - y0) * box.width + (x - x0)) * 4;
      const [r, g, b] = rgbAt(image, i);
      rgba.set([r, g, b, Math.round((kept[i] ?? 0) * 255)], o);
    }
  }
  return { rgba, box };
}

/** How image pixels map onto the artboard: a scale, and where one image point lands. */
export interface Placement {
  /** Artboard units per image pixel. */
  readonly scale: number;
  /** An image point (`from`) and the artboard point it lands on (`to`). */
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
}

/** Rounds to one decimal, so the JSON stays readable. */
const round1 = (value: number) => Math.round(value * 10) / 10;

/** A box in image pixels as `size` and `position` on the artboard. */
export function placeBox(
  box: Box,
  placement: Placement,
): { size: [number, number]; position: [number, number] } {
  const { scale, from, to } = placement;
  return {
    size: [round1(box.width * scale), round1(box.height * scale)],
    position: [
      round1(to[0] + (box.x - from[0]) * scale),
      round1(to[1] + (box.y - from[1]) * scale),
    ],
  };
}

/** An image point (a joint) as a pivot in the layer's own coordinates, in artboard units. */
export function pivotIn(
  box: Box,
  point: readonly [number, number],
  scale: number,
): [number, number] {
  return [round1((point[0] - box.x) * scale), round1((point[1] - box.y) * scale)];
}

/**
 * The horizontal middle of the body: the average column of solid figure pixels in rows
 * `fromRow`–`toRow`. Better than the middle of the box for a side view, where the bill and the
 * tail stick out unevenly.
 */
export function bodyCentreX(
  alpha: AlphaMap,
  width: number,
  fromRow: number,
  toRow: number,
): number {
  let sum = 0;
  let count = 0;
  for (let y = fromRow; y < toRow; y++) {
    for (let x = 0; x < width; x++) {
      if ((alpha[y * width + x] ?? 0) >= 1) {
        sum += x;
        count++;
      }
    }
  }
  return count === 0 ? width / 2 : sum / count;
}

/** The lowest row with any figure pixel: where his feet touch the ground. */
export function groundRow(alpha: AlphaMap, width: number): number {
  for (let i = alpha.length - 1; i >= 0; i--) {
    if ((alpha[i] ?? 0) > 0) return Math.floor(i / width);
  }
  return 0;
}

/** The average colour of the dark plumage: solid, dark pixels that aren't yellow or red. */
export function plumageTone(image: RawImage, alpha: AlphaMap): [number, number, number] {
  const sum: [number, number, number] = [0, 0, 0];
  let count = 0;
  for (let i = 0; i < alpha.length; i++) {
    if ((alpha[i] ?? 0) < 1) continue;
    const [r, g, b] = rgbAt(image, i);
    if (Math.min(r, g, b) >= 120 || r >= 140) continue;
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
    count++;
  }
  return count === 0 ? [0, 0, 0] : [sum[0] / count, sum[1] / count, sum[2] / count];
}

/**
 * A copy of `image` with each channel multiplied so its plumage tone becomes `target`. Lighter
 * pixels change proportionally less in absolute terms and white stays near white, because the
 * gain is applied to the distance from white rather than to the value itself.
 */
export function matchTone(
  image: RawImage,
  tone: readonly [number, number, number],
  target: readonly [number, number, number],
): RawImage {
  // Gain on "how far from white": a tone of 84 → 74 means distances grow by (255-74)/(255-84).
  const gains = tone.map((value, k) => (255 - (target[k] ?? 0)) / Math.max(1, 255 - value));
  const data = new Uint8Array(image.data.length);
  for (let i = 0; i < image.width * image.height; i++) {
    const o = i * image.channels;
    for (let k = 0; k < image.channels; k++) {
      const value = image.data[o + k] ?? 0;
      data[o + k] =
        k < 3
          ? Math.round(Math.min(255, Math.max(0, 255 - (255 - value) * (gains[k] ?? 1))))
          : value;
    }
  }
  return { ...image, data };
}

/** A box of image pixels to keep, for the professional extras: [left, top, right, bottom]. */
export type PixelBounds = readonly [number, number, number, number];

/**
 * Where Kálmán's parts are in his front view, in image pixels. The numbers belong to one pair
 * of images; new images get new numbers, checked with the preview's pivot overlay.
 */
export interface FrontCutSettings {
  /** The column through the middle of the figure; right is the mirror image of left. */
  readonly centreX: number;
  /** The head fades out between these rows; the body starts at the first and is solid from the second. */
  readonly neck: {
    readonly headFadeFrom: number;
    readonly headFadeTo: number;
    readonly bodyFrom: number;
    readonly bodySolid: number;
  };
  /** Above this row the body takes the full width, so the neck sides are always covered. */
  readonly shoulderRow: number;
  /** The flippers: from and to which row, and the straight cut along the shoulder above the gap. */
  readonly flipper: {
    readonly fromRow: number;
    readonly toRow: number;
    /** From this row on there is a real gap between flipper and body, found per row. */
    readonly gapFromRow: number;
    /** The shoulder cut runs from `shoulder` (top) to `gapTop` (where the gap begins), left side. */
    readonly shoulder: readonly [number, number];
    readonly gapTop: readonly [number, number];
    /** How far a flipper reaches under the body above the gap, to hide the seam. */
    readonly underlap: number;
  };
  /** The body ends at this row; the feet and tail start a little above it (they overlap). */
  readonly bodyBottomRow: number;
  readonly feet: {
    readonly fromRow: number;
    readonly leftMaxX: number;
    readonly rightMinX: number;
  };
  readonly tail: {
    readonly fromRow: number;
    readonly toRow: number;
    readonly minX: number;
    readonly maxX: number;
  };
  /** Where the professional extras are (the rest of the difference is ignored as noise). */
  readonly glasses: PixelBounds;
  readonly tie: PixelBounds;
}

/** The nine parts as regions: one function per layer name saying how much of a pixel it takes. */
export function frontRegions(
  settings: FrontCutSettings,
  leftGap: ReadonlyMap<number, number | undefined>,
  rightGap: ReadonlyMap<number, number | undefined>,
): Record<string, PartRegion> {
  const { centreX, neck, shoulderRow, flipper, bodyBottomRow, feet, tail } = settings;
  const [sx, sy] = flipper.shoulder;
  const [gx, gy] = flipper.gapTop;
  // The left cut: a straight line along the shoulder, then the real gap row by row.
  const leftCut = (y: number) =>
    y < flipper.gapFromRow ? sx + ((gx - sx) * (y - sy)) / (gy - sy) : (leftGap.get(y) ?? gx);
  const rightCut = (y: number) =>
    y < flipper.gapFromRow ? 2 * centreX - leftCut(y) : (rightGap.get(y) ?? 2 * centreX - gx);
  const headFade = ramp(neck.headFadeFrom, neck.headFadeTo);
  const bodyFade = ramp(neck.bodyFrom, neck.bodySolid);
  const inFlipperRows = (y: number) => y >= flipper.fromRow && y < flipper.toRow;
  // Above the gap the flipper reaches under the body; below it, it stops exactly at the gap.
  const underlap = (y: number) => (y < flipper.gapFromRow ? flipper.underlap : 0);
  const inside = (bounds: PixelBounds, x: number, y: number) =>
    x >= bounds[0] && y >= bounds[1] && x <= bounds[2] && y < bounds[3];
  const yes = (condition: boolean) => (condition ? 1 : 0);

  return {
    head: (_x, y) => 1 - headFade(y),
    body: (x, y) =>
      y < neck.bodyFrom || y >= bodyBottomRow
        ? 0
        : bodyFade(y) * yes(y < shoulderRow || (x >= leftCut(y) && x <= rightCut(y))),
    flipperLeft: (x, y) => yes(inFlipperRows(y) && x < leftCut(y) + underlap(y)),
    flipperRight: (x, y) => yes(inFlipperRows(y) && x > rightCut(y) - underlap(y)),
    footLeft: (x, y) => yes(y >= feet.fromRow && x <= feet.leftMaxX),
    footRight: (x, y) => yes(y >= feet.fromRow && x >= feet.rightMinX),
    tail: (x, y) => yes(y >= tail.fromRow && y < tail.toRow && x >= tail.minX && x <= tail.maxX),
    glasses: (x, y) => yes(inside(settings.glasses, x, y)),
    tie: (x, y) => yes(inside(settings.tie, x, y)),
  };
}

/**
 * How much of each pixel lies inside a polygon (a list of corner points), from 0 to 1. Each
 * pixel is tested at `samples` × `samples` points spread over it, so the edge is smooth instead
 * of jagged (like rendering with anti-aliasing). Used for the side flipper, whose outline is
 * traced once on the image because it lies on the body and has no background around it.
 */
export function polygonCoverage(
  points: readonly (readonly [number, number])[],
  width: number,
  height: number,
  samples = 4,
): AlphaMap {
  // Point-in-polygon by ray casting: count how many edges a ray to the right crosses; an odd
  // count means inside. Only rows inside the polygon's box are tested, for speed.
  const inside = (px: number, py: number) => {
    let crossings = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i] ?? [0, 0];
      const [xj, yj] = points[j] ?? [0, 0];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) crossings++;
    }
    return crossings % 2 === 1;
  };
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const coverage = new Float32Array(width * height);
  for (
    let y = Math.max(0, Math.floor(Math.min(...ys)));
    y <= Math.min(height - 1, Math.ceil(Math.max(...ys)));
    y++
  ) {
    for (
      let x = Math.max(0, Math.floor(Math.min(...xs)));
      x <= Math.min(width - 1, Math.ceil(Math.max(...xs)));
      x++
    ) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          if (inside(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples)) hits++;
        }
      }
      coverage[y * width + x] = hits / (samples * samples);
    }
  }
  return coverage;
}

/** Where the side figure's parts are in its images, in image pixels (kalman-animations design §6). */
export interface SideCutSettings {
  /** The head fades out between these rows; the body starts at the first and is solid from the second. */
  readonly neck: {
    readonly headFadeFrom: number;
    readonly headFadeTo: number;
    readonly bodyFrom: number;
    readonly bodySolid: number;
  };
  /** The body is whole down to this row; below it only a strip under the ankles (`feet.stub`). */
  readonly bodyBottomRow: number;
  /**
   * The tail: everything from this row down and this column to the right. The body keeps the
   * tail's first `bodyOverlap` rows too, so no gap opens at the joint when the tail turns (the
   * tail is drawn behind the body, so the overlap doesn't show).
   */
  readonly tail: { readonly fromRow: number; readonly minX: number; readonly bodyOverlap: number };
  /**
   * The feet: only their dark pixels, fading in from `fromRow` to `solidRow` (a soft ankle, like
   * the neck), so a turning foot shows no straight cut and takes no white feathers along. The
   * back foot is the part left of `backMaxX` above `backMaxRow`. `stub` is the strip under the
   * ankles that the body keeps below `bodyBottomRow` (the white feathers and the ankles),
   * fading out towards `stub.fadeTo`: painted leg behind a turning foot instead of a hole.
   */
  readonly feet: {
    readonly fromRow: number;
    readonly solidRow: number;
    readonly stub: { readonly minX: number; readonly maxX: number; readonly fadeTo: number };
    readonly backMaxX: number;
    readonly backMaxRow: number;
  };
  /** Where the professional extras are. */
  readonly glasses: PixelBounds;
  readonly tie: PixelBounds;
}

/**
 * The side figure's parts as regions. The flipper is not a box but its traced outline, passed
 * in as a coverage map (`polygonCoverage()`); `darkness` (`darknessMap()`) tells the feet from
 * the feathers over them; `width` is the image width, to look both up.
 */
export function sideRegions(
  settings: SideCutSettings,
  flipper: AlphaMap,
  darkness: AlphaMap,
  width: number,
): Record<string, PartRegion> {
  const { neck, bodyBottomRow, tail, feet } = settings;
  const headFade = ramp(neck.headFadeFrom, neck.headFadeTo);
  const bodyFade = ramp(neck.bodyFrom, neck.bodySolid);
  const ankleFade = ramp(feet.fromRow, feet.solidRow);
  const stubFade = ramp(bodyBottomRow, feet.stub.fadeTo);
  const inStub = (x: number) => x >= feet.stub.minX && x <= feet.stub.maxX;
  const dark = (x: number, y: number) => darkness[y * width + x] ?? 0;
  /** How much of a pixel belongs to a foot: its darkness, faded in at the ankle. */
  const footShare = (x: number, y: number) => dark(x, y) * ankleFade(y);
  const inTail = (x: number, y: number) => y >= tail.fromRow && x >= tail.minX;
  const inBackFoot = (x: number, y: number) =>
    y >= feet.fromRow && x <= feet.backMaxX && y < feet.backMaxRow;
  const inside = (bounds: PixelBounds, x: number, y: number) =>
    x >= bounds[0] && y >= bounds[1] && x <= bounds[2] && y < bounds[3];
  const yes = (condition: boolean) => (condition ? 1 : 0);

  return {
    head: (_x, y) => 1 - headFade(y),
    // Cut from the image without the flipper, so the body under the flipper is painted.
    body: (x, y) => {
      if (y < neck.bodyFrom || inTail(x, y - tail.bodyOverlap)) return 0;
      if (y < bodyBottomRow) return bodyFade(y);
      return inStub(x) ? 1 - stubFade(y) : 0;
    },
    flipper: (x, y) => flipper[y * width + x] ?? 0,
    footBack: (x, y) => (inBackFoot(x, y) ? footShare(x, y) : 0),
    footFront: (x, y) =>
      y >= feet.fromRow && !inBackFoot(x, y) && !inTail(x, y) ? footShare(x, y) : 0,
    tail: (x, y) => yes(inTail(x, y)),
    glasses: (x, y) => yes(inside(settings.glasses, x, y)),
    tie: (x, y) => yes(inside(settings.tie, x, y)),
  };
}

/** Where the swimming figure's parts are in its images (kalman-animation-feel design §13). */
export interface SwimCutSettings {
  /** The glasses, with the calm eye. */
  readonly glasses: PixelBounds;
  /** The tie: everything in these bounds right of `fromX`, or below `lowerFromY` (the tip). */
  readonly tie: PixelBounds;
  readonly tieFromX: number;
  readonly tieLowerFromY: number;
}

/**
 * The swimming figure's parts as regions. It is drawn as one piece (head, feet and tail in the
 * body), so only the flipper (its traced outline, `flipper`, as for the side figure) and the
 * professional extras are separate; `width` is the image width, to look the flipper up.
 */
export function swimRegions(
  settings: SwimCutSettings,
  flipper: AlphaMap,
  width: number,
): Record<string, PartRegion> {
  const inside = (bounds: PixelBounds, x: number, y: number) =>
    x >= bounds[0] && y >= bounds[1] && x <= bounds[2] && y < bounds[3];
  const yes = (condition: boolean) => (condition ? 1 : 0);
  return {
    // Cut from the image without the flipper, so the body under the flipper is painted.
    body: () => 1,
    flipper: (x, y) => flipper[y * width + x] ?? 0,
    glasses: (x, y) => yes(inside(settings.glasses, x, y)),
    tie: (x, y) =>
      yes(
        inside(settings.tie, x, y) &&
          (x >= settings.tieFromX || y >= settings.tieLowerFromY) &&
          !inside(settings.glasses, x, y),
      ),
  };
}
