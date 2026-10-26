/**
 * Cuts Kálmán's layers and turntable views out of Raymond's design images (kalman-rig design §5).
 *
 * Run with `npm run cut:kalman` after changing an image in docs/images/kalman-design/. It
 * writes the layers and views to src/assets/kalman/front/, and src/scene/kalman/rig.json and
 * turntable.json (Prettier formats them afterwards). Running it twice on the same images gives
 * the same files, so `git status` shows exactly what a new image changed.
 *
 * This file only reads, writes and holds the settings; every decision is a tested function in
 * scripts/lib/kalman-cut.ts. Node 24 runs this `.ts` file directly ("type stripping").
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  assertSameSize,
  cutPart,
  differenceAlpha,
  figureAlpha,
  findBackground,
  frontRegions,
  gapPerRow,
  pivotIn,
  placeBox,
  type FrontCutSettings,
  type Placement,
  type RawImage,
} from './lib/kalman-cut.ts';

const DESIGN = 'docs/images/kalman-design';
const OUT = 'src/assets/kalman/front';
const RIG_FILE = 'src/scene/kalman/rig.json';
const TURNTABLE_FILE = 'src/scene/kalman/turntable.json';

// ---------------------------------------------------------------------------------------
// Settings: the numbers that belong to these images (pixel rows and columns of the front view)
// ---------------------------------------------------------------------------------------

/** The front views: the professional one is an edit of the goofy one, so they line up. */
const FRONT = {
  goofy: `${DESIGN}/front-goofy.png`,
  professional: `${DESIGN}/front-professional.png`,
};

/** Where the parts are in the front view, found with the row-by-row outline (making-of). */
const CUT: FrontCutSettings = {
  centreX: 344,
  neck: { headFadeFrom: 208, headFadeTo: 262, bodyFrom: 184, bodySolid: 214 },
  shoulderRow: 255,
  flipper: {
    fromRow: 250,
    toRow: 780,
    gapFromRow: 553,
    shoulder: [262, 255],
    gapTop: [161, 553],
    underlap: 2,
  },
  bodyBottomRow: 908,
  feet: { fromRow: 898, leftMaxX: 297, rightMinX: 391 },
  tail: { fromRow: 888, toRow: 952, minX: 294, maxX: 394 },
  glasses: [232, 68, 452, 178],
  tie: [222, 200, 466, 645],
};

/** Image pixels → artboard: Kálmán (918 px tall) becomes ~1222 units, centred on x 800, top at 180. */
const PLACEMENT: Placement = { scale: 1.33, from: [CUT.centreX, 53], to: [800, 180] };

/** Per layer: its file, its joint in the image (the pivot) and the rest of its rig entry. */
const LAYERS = [
  { name: 'body', file: 'body', pivot: [344, 900], parent: null, order: 20, rotate: [-15, 15] },
  { name: 'head', file: 'head', pivot: [344, 236], parent: 'body', order: 30, rotate: [-25, 25] },
  {
    name: 'flipperLeft',
    file: 'flipper-left',
    pivot: [246, 286],
    parent: 'body',
    order: 10,
    rotate: [-15, 150],
  },
  {
    name: 'flipperRight',
    file: 'flipper-right',
    pivot: [442, 286],
    parent: 'body',
    order: 11,
    rotate: [-150, 15],
  },
  {
    name: 'footLeft',
    file: 'foot-left',
    pivot: [262, 906],
    parent: 'body',
    order: 25,
    rotate: [-20, 20],
  },
  {
    name: 'footRight',
    file: 'foot-right',
    pivot: [428, 906],
    parent: 'body',
    order: 26,
    rotate: [-20, 20],
  },
  { name: 'tail', file: 'tail', pivot: [344, 896], parent: 'body', order: 15, rotate: [-25, 25] },
  {
    name: 'tie',
    file: 'tie',
    pivot: [344, 300],
    parent: 'body',
    order: 50,
    rotate: [-15, 15],
    accessory: true,
  },
  {
    name: 'glasses',
    file: 'glasses',
    pivot: [344, 110],
    parent: 'head',
    order: 60,
    rotate: [-10, 10],
    accessory: true,
  },
] as const;

// ---------------------------------------------------------------------------------------
// Reading and writing images
// ---------------------------------------------------------------------------------------

/** Reads an image as raw RGB pixels (any transparency is dropped). */
async function readRgb(file: string): Promise<RawImage> {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, data };
}

/** Writes RGBA pixels as a PNG. */
async function writePng(file: string, rgba: Uint8Array, width: number, height: number) {
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/** Writes JSON with two-space indents; `npm run cut:kalman` formats it with Prettier next. */
function writeJson(file: string, value: unknown) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

// ---------------------------------------------------------------------------------------
// The cutting
// ---------------------------------------------------------------------------------------

const goofy = await readRgb(FRONT.goofy);
const professional = await readRgb(FRONT.professional);
assertSameSize(goofy, professional, 'The goofy and professional front views');

const background = findBackground(goofy);
const bodyAlpha = figureAlpha(goofy, background);
const extrasAlpha = differenceAlpha(goofy, professional);
const rows = [CUT.flipper.gapFromRow, CUT.flipper.toRow] as const;
const regions = frontRegions(
  CUT,
  gapPerRow(background, goofy.width, ...rows, 'left', CUT.centreX),
  gapPerRow(background, goofy.width, ...rows, 'right', CUT.centreX),
);

mkdirSync(OUT, { recursive: true });
const rigLayers = [];
for (const layer of LAYERS) {
  const isExtra = layer.name === 'tie' || layer.name === 'glasses';
  const region = regions[layer.name];
  const part =
    region === undefined
      ? undefined
      : cutPart(isExtra ? professional : goofy, isExtra ? extrasAlpha : bodyAlpha, region);
  if (part === undefined) throw new Error(`The ${layer.name} region is empty: check the settings.`);
  await writePng(join(OUT, `${layer.file}.png`), part.rgba, part.box.width, part.box.height);
  rigLayers.push({
    name: layer.name,
    image: `front/${layer.file}.png`,
    ...placeBox(part.box, PLACEMENT),
    pivot: pivotIn(part.box, layer.pivot, PLACEMENT.scale),
    parent: layer.parent,
    order: layer.order,
    rotate: layer.rotate,
    ...('accessory' in layer ? { accessory: true } : {}),
  });
  console.log(`${layer.name.padEnd(13)} ${part.box.width}×${part.box.height} px`);
}
writeJson(RIG_FILE, { artboard: [1600, 1500], layers: rigLayers });

// The front view, whole, for the turntable: one image per mood.
const frontImages: Record<
  string,
  { image: string; size: [number, number]; position: [number, number] }
> = {};
for (const [mood, image, file] of [
  ['goofy', goofy, 'view-front.png'],
  ['professional', professional, 'view-front-pro.png'],
] as const) {
  const whole = cutPart(image, figureAlpha(image, findBackground(image)), () => 1);
  if (whole === undefined) throw new Error(`The ${mood} front view is empty.`);
  await writePng(join(OUT, file), whole.rgba, whole.box.width, whole.box.height);
  frontImages[mood] = { image: `front/${file}`, ...placeBox(whole.box, PLACEMENT) };
}
writeJson(TURNTABLE_FILE, { views: [{ name: 'front', angle: 0, images: frontImages }] });

console.log(`Written: ${OUT}/, ${RIG_FILE} and ${TURNTABLE_FILE}.`);
