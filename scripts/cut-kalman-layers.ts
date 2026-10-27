/**
 * Cuts Kálmán's layers, turntable views and drawn poses out of Raymond's design images
 * (kalman-rig design §5, kalman-animation-feel design §7).
 *
 * Run with `npm run cut:kalman` after changing an image in docs/images/kalman-design/. It
 * writes the layers and front views to src/assets/kalman/front/, the turntable views to
 * src/assets/kalman/views/, the drawn poses to src/assets/kalman/drawn/, and
 * src/scene/kalman/rig.json, turntable.json and drawn-poses.json (Prettier formats them
 * afterwards). Running it twice on the same images gives
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
  blendImages,
  bodyCentreX,
  darknessMap,
  cutPart,
  differenceAlpha,
  figureAlpha,
  findBackground,
  frontRegions,
  gapPerRow,
  groundRow,
  matchTone,
  pivotIn,
  restrictAlpha,
  placeBox,
  plumageTone,
  polygonCoverage,
  sideRegions,
  swimRegions,
  type SwimCutSettings,
  type SideCutSettings,
  type FrontCutSettings,
  type Placement,
  type RawImage,
} from './lib/kalman-cut.ts';

const DESIGN = 'docs/images/kalman-design';
const OUT = 'src/assets/kalman/front';
const VIEWS_OUT = 'src/assets/kalman/views';
const SIDE_OUT = 'src/assets/kalman/side';
const RIG_FILE = 'src/scene/kalman/rig.json';
const TURNTABLE_FILE = 'src/scene/kalman/turntable.json';
const SWIM_OUT = 'src/assets/kalman/swim';
const DRAWN_OUT = 'src/assets/kalman/drawn';
const DRAWN_FILE = 'src/scene/kalman/drawn-poses.json';

/**
 * The drawn poses: whole drawings shown instead of the layers at a keyframe. Each is an edit
 * of front-goofy.png that changes only his upper body, with a professional edit of it.
 */
const DRAWN_POSES = [{ name: 'bow', file: 'front-bow' }] as const;

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

/**
 * The front views without pupils (kalman-animation-feel design §11): edits of the two front
 * views in which only the pupils are gone. Two thresholds for two jobs: emptying the eyes takes
 * everything that differs a little (so no ring of a pupil's soft edge stays behind on the
 * head), while the moving pupils only take what differs a lot (so no piece of the eye's
 * outline, which Gemini redraws slightly, moves along with them).
 */
const NO_PUPILS = {
  goofy: `${DESIGN}/front-goofy-no-pupils.png`,
  professional: `${DESIGN}/front-professional-no-pupils.png`,
  empty: { threshold: 20, range: 20 },
  pupils: { threshold: 80, range: 40 },
};

/** Image pixels → artboard: Kálmán (918 px tall) becomes ~1222 units, centred on x 800, top at 180. */
const PLACEMENT: Placement = { scale: 1.33, from: [CUT.centreX, 53], to: [800, 180] };

/** Per layer: its file, its joint in the image (the pivot) and the rest of its rig entry. */
const LAYERS = [
  {
    name: 'body',
    file: 'body',
    pivot: [344, 900],
    parent: null,
    order: 20,
    rotate: [-15, 15],
    // Squash and stretch (kalman-animation-feel design §6): around the feet, so he sinks.
    stretch: [0.85, 1.15],
  },
  {
    name: 'head',
    file: 'head',
    pivot: [344, 236],
    parent: 'body',
    order: 30,
    rotate: [-25, 25],
    stretch: [0.92, 1.08],
  },
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
  // The pupils (kalman-animation-feel design §11): both eyes in one layer, hanging from the head,
  // and only `shift` artboard units each way, so they stay inside the eyes. The goofy ones only
  // show in the goofy mood; the professional ones are above the glasses, with the calm eyes.
  {
    name: 'pupils',
    file: 'pupils',
    pivot: [344, 115],
    parent: 'head',
    order: 35,
    rotate: [-5, 5],
    shift: [12, 8],
    mood: 'goofy',
  },
  {
    name: 'pupilsProfessional',
    file: 'pupils-professional',
    pivot: [344, 115],
    parent: 'head',
    order: 65,
    rotate: [-5, 5],
    shift: [4, 2],
    accessory: true,
  },
] as const;

/**
 * The turntable views: each drawn with his bill to the left of the picture, with a professional
 * version as an edit of it (`<file>-professional.png`). The other side is mirrored.
 */
const VIEWS = [
  { name: '3q-front', angle: 45, file: 'view-3q-front' },
  { name: 'side', angle: 90, file: 'view-side' },
  { name: '3q-back', angle: 135, file: 'view-3q-back' },
  { name: 'back', angle: 180, file: 'view-back' },
] as const;
const MIRRORS = [
  { name: '3q-back-mirrored', angle: 225, mirrorOf: '3q-back' },
  { name: 'side-mirrored', angle: 270, mirrorOf: 'side' },
  { name: '3q-front-mirrored', angle: 315, mirrorOf: '3q-front' },
] as const;
/** The rows of the body (no head, bill or tail) used to centre a view. */
const BODY_ROWS = [280, 900] as const;

/**
 * The side figure for posing and swimming (kalman-animations design §6): the goofy side view,
 * its professional edit, and an edit without the near flipper, which gives the body under it.
 */
const SIDE = {
  goofy: `${DESIGN}/side-goofy.png`,
  professional: `${DESIGN}/side-professional.png`,
  noFlipper: `${DESIGN}/side-no-flipper.png`,
};

/**
 * The swimming figure (kalman-animation-feel design §13): Kálmán drawn horizontally, its
 * professional edit, and an edit without the near flipper. Placed with its middle in the middle
 * of the stage, at the same scale as the other figures.
 */
const SWIM = {
  goofy: `${DESIGN}/swim-goofy.png`,
  professional: `${DESIGN}/swim-professional.png`,
  noFlipper: `${DESIGN}/swim-no-flipper.png`,
  /** The middle of his body in the image, and where it lands on the artboard. */
  middle: [510, 350] as const,
  stage: [800, 760] as const,
};
const SWIM_CUT: SwimCutSettings = {
  glasses: [135, 230, 330, 305],
  tie: [278, 230, 555, 550],
  tieFromX: 330,
  tieLowerFromY: 320,
};
/** The swimming figure's near flipper, traced on swim-goofy.png clockwise from the shoulder. */
const SWIM_FLIPPER: readonly (readonly [number, number])[] = [
  [495, 292],
  [530, 296],
  [565, 304],
  [600, 318],
  [640, 336],
  [680, 350],
  [720, 362],
  [742, 370],
  [750, 382],
  [745, 393],
  [725, 400],
  [690, 403],
  [645, 403],
  [600, 397],
  [560, 386],
  [525, 373],
  [495, 362],
  [470, 352],
  [478, 330],
  [488, 305],
];
/** Per swim layer: its joint in the image (the pivot), the image it comes from, the rest. */
const SWIM_LAYERS = [
  {
    name: 'body',
    pivot: [510, 350],
    parent: null,
    order: 20,
    rotate: [-30, 30],
    stretch: [0.85, 1.15],
    from: 'noFlipper',
  },
  {
    name: 'flipper',
    pivot: [500, 318],
    parent: 'body',
    order: 40,
    rotate: [-60, 60],
    from: 'goofy',
  },
  {
    name: 'tie',
    pivot: [350, 300],
    parent: 'body',
    order: 50,
    rotate: [-15, 15],
    from: 'professional',
    accessory: true,
  },
  {
    name: 'glasses',
    pivot: [230, 270],
    parent: 'body',
    order: 60,
    rotate: [-10, 10],
    from: 'professional',
    accessory: true,
  },
] as const;

/** Where the side figure's parts are, measured on side-goofy.png (outline per row, grid). */
const SIDE_CUT: SideCutSettings = {
  neck: { headFadeFrom: 208, headFadeTo: 262, bodyFrom: 184, bodySolid: 214 },
  // Whole down to the ankles; below, a fading strip under them (kalman-animation-feel).
  bodyBottomRow: 918,
  tail: { fromRow: 840, minX: 448, bodyOverlap: 25 },
  feet: {
    fromRow: 898,
    solidRow: 918,
    stub: { minX: 295, maxX: 440, fadeTo: 945 },
    backMaxX: 299,
    backMaxRow: 950,
  },
  glasses: [226, 66, 442, 162],
  tie: [178, 198, 477, 622],
};

/**
 * The near flipper's outline on side-goofy.png, clockwise from the shoulder: it lies on the
 * body, so there is no background around it to find it by. The top, where it joins the back,
 * is an estimate; the body underneath comes from the image without the flipper anyway.
 */
const SIDE_FLIPPER: readonly (readonly [number, number])[] = [
  [365, 410],
  [390, 385],
  [430, 390],
  [460, 425],
  [475, 475],
  [472, 520],
  [460, 570],
  [450, 610],
  [442, 660],
  [437, 710],
  [432, 755],
  [422, 782],
  [407, 785],
  [387, 760],
  [367, 720],
  [355, 670],
  [350, 610],
  [352, 550],
  [357, 495],
  [362, 450],
];

/** Per side layer: its file, its joint in the image (the pivot) and the rest of its rig entry. */
const SIDE_LAYERS = [
  {
    name: 'body',
    // The side body turns around its middle, so a dive or a launch keeps him on the stage.
    pivot: [345, 560],
    parent: null,
    order: 20,
    // Down to −150° so he can go into the water head first (kalman-animation-feel §6).
    rotate: [-150, 100],
    stretch: [0.85, 1.15],
    from: 'noFlipper',
  },
  {
    name: 'head',
    pivot: [350, 236],
    parent: 'body',
    order: 30,
    // Up to 70° back, so when he swims horizontally his bill can point forward (kalman-animation-feel).
    rotate: [-30, 70],
    stretch: [0.92, 1.08],
    from: 'goofy',
  },
  {
    name: 'flipper',
    pivot: [405, 415],
    parent: 'body',
    order: 40,
    rotate: [-120, 60],
    from: 'goofy',
  },
  // Both side feet share one pivot, so they turn as one piece when they turn together: the
  // line between them in the drawing never shows (kalman-animation-feel).
  {
    name: 'footBack',
    pivot: [330, 914],
    parent: 'body',
    order: 12,
    rotate: [-20, 20],
    from: 'goofy',
  },
  {
    name: 'footFront',
    pivot: [330, 914],
    parent: 'body',
    order: 25,
    rotate: [-20, 20],
    from: 'goofy',
  },
  { name: 'tail', pivot: [452, 848], parent: 'body', order: 10, rotate: [-25, 25], from: 'goofy' },
  {
    name: 'tie',
    pivot: [262, 272],
    parent: 'body',
    order: 50,
    rotate: [-15, 15],
    from: 'professional',
    accessory: true,
  },
  {
    name: 'glasses',
    pivot: [320, 105],
    parent: 'head',
    order: 60,
    rotate: [-10, 10],
    from: 'professional',
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

// The eyes without pupils: the original views everywhere, and the edits only where the pupils
// were, so everything else keeps exactly its colours. The pupils are that same difference.
const goofyNoPupils = await readRgb(NO_PUPILS.goofy);
const professionalNoPupils = await readRgb(NO_PUPILS.professional);
assertSameSize(goofy, goofyNoPupils, 'The goofy front view and its edit without pupils');
assertSameSize(
  professional,
  professionalNoPupils,
  'The professional front view and its edit without pupils',
);
const eyeDifference = (
  view: typeof goofy,
  edit: typeof goofy,
  { threshold, range }: { threshold: number; range: number },
) => restrictAlpha(differenceAlpha(edit, view, threshold, range), view.width, CUT.glasses);
const goofyPupils = eyeDifference(goofy, goofyNoPupils, NO_PUPILS.pupils);
const professionalPupils = eyeDifference(professional, professionalNoPupils, NO_PUPILS.pupils);
const goofyEmptyEyes = blendImages(
  goofy,
  goofyNoPupils,
  eyeDifference(goofy, goofyNoPupils, NO_PUPILS.empty),
);
const professionalEmptyEyes = blendImages(
  professional,
  professionalNoPupils,
  eyeDifference(professional, professionalNoPupils, NO_PUPILS.empty),
);
// The glasses (with the calm eyes) are where the professional view differs from the goofy one,
// both with empty eyes; the tie stays as before.
const glassesAlpha = differenceAlpha(goofyEmptyEyes, professionalEmptyEyes);

/** Which image and which alpha each front layer is cut from. */
function sourceOf(name: string): { image: typeof goofy; alpha: Float32Array } {
  if (name === 'head') return { image: goofyEmptyEyes, alpha: bodyAlpha };
  if (name === 'glasses') return { image: professionalEmptyEyes, alpha: glassesAlpha };
  if (name === 'tie') return { image: professional, alpha: extrasAlpha };
  if (name === 'pupils') return { image: goofy, alpha: goofyPupils };
  if (name === 'pupilsProfessional') return { image: professional, alpha: professionalPupils };
  return { image: goofy, alpha: bodyAlpha };
}
const rows = [CUT.flipper.gapFromRow, CUT.flipper.toRow] as const;
const regions = frontRegions(
  CUT,
  gapPerRow(background, goofy.width, ...rows, 'left', CUT.centreX),
  gapPerRow(background, goofy.width, ...rows, 'right', CUT.centreX),
);

mkdirSync(OUT, { recursive: true });
const rigLayers = [];
for (const layer of LAYERS) {
  // The pupils need no region of their own: their alpha is already only the pupils.
  const region = layer.name.startsWith('pupils') ? () => 1 : regions[layer.name];
  const source = sourceOf(layer.name);
  const part = region === undefined ? undefined : cutPart(source.image, source.alpha, region);
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
    ...('stretch' in layer ? { stretch: layer.stretch } : {}),
    ...('shift' in layer ? { shift: layer.shift } : {}),
    ...('accessory' in layer ? { accessory: true } : {}),
    ...('mood' in layer ? { mood: layer.mood } : {}),
  });
  console.log(`${layer.name.padEnd(13)} ${part.box.width}×${part.box.height} px`);
}
const ARTBOARD = [1600, 1500] as const;

// The side figure: the same steps, with the body from the image without the flipper and the
// flipper along its traced outline. Placed like the front: his body centred on x 800, the top of
// his head at y 180, so switching figures doesn't make him jump.
const side = {
  goofy: await readRgb(SIDE.goofy),
  professional: await readRgb(SIDE.professional),
  noFlipper: await readRgb(SIDE.noFlipper),
};
assertSameSize(side.goofy, side.professional, 'The goofy and professional side views');
assertSameSize(side.goofy, side.noFlipper, 'The side view and the side view without the flipper');
const sideAlpha = {
  goofy: figureAlpha(side.goofy, findBackground(side.goofy)),
  professional: differenceAlpha(side.goofy, side.professional),
  noFlipper: figureAlpha(side.noFlipper, findBackground(side.noFlipper)),
};
const sideRegionsByName = sideRegions(
  SIDE_CUT,
  polygonCoverage(SIDE_FLIPPER, side.goofy.width, side.goofy.height),
  darknessMap(side.goofy),
  side.goofy.width,
);
const sidePlacement: Placement = {
  scale: PLACEMENT.scale,
  from: [bodyCentreX(sideAlpha.noFlipper, side.goofy.width, ...BODY_ROWS), PLACEMENT.from[1]],
  to: PLACEMENT.to,
};
mkdirSync(SIDE_OUT, { recursive: true });
const sideLayers = [];
for (const layer of SIDE_LAYERS) {
  const region = sideRegionsByName[layer.name];
  const part =
    region === undefined ? undefined : cutPart(side[layer.from], sideAlpha[layer.from], region);
  if (part === undefined)
    throw new Error(`The side ${layer.name} region is empty: check the settings.`);
  await writePng(join(SIDE_OUT, `${layer.name}.png`), part.rgba, part.box.width, part.box.height);
  sideLayers.push({
    name: layer.name,
    image: `side/${layer.name}.png`,
    ...placeBox(part.box, sidePlacement),
    pivot: pivotIn(part.box, layer.pivot, sidePlacement.scale),
    parent: layer.parent,
    order: layer.order,
    rotate: layer.rotate,
    ...('stretch' in layer ? { stretch: layer.stretch } : {}),
    ...('accessory' in layer ? { accessory: true } : {}),
  });
  console.log(`side ${layer.name.padEnd(9)} ${part.box.width}×${part.box.height} px`);
}
// The swimming figure: the same steps again, with one body (drawn in one piece) and the flipper.
const swim = {
  goofy: await readRgb(SWIM.goofy),
  professional: await readRgb(SWIM.professional),
  noFlipper: await readRgb(SWIM.noFlipper),
};
assertSameSize(swim.goofy, swim.professional, 'The goofy and professional swim views');
assertSameSize(swim.goofy, swim.noFlipper, 'The swim view and the swim view without the flipper');
const swimAlpha = {
  goofy: figureAlpha(swim.goofy, findBackground(swim.goofy)),
  professional: differenceAlpha(swim.goofy, swim.professional),
  noFlipper: figureAlpha(swim.noFlipper, findBackground(swim.noFlipper)),
};
const swimRegionsByName = swimRegions(
  SWIM_CUT,
  polygonCoverage(SWIM_FLIPPER, swim.goofy.width, swim.goofy.height),
  swim.goofy.width,
);
const swimPlacement: Placement = { scale: PLACEMENT.scale, from: SWIM.middle, to: SWIM.stage };
mkdirSync(SWIM_OUT, { recursive: true });
const swimLayers = [];
for (const layer of SWIM_LAYERS) {
  const region = swimRegionsByName[layer.name];
  const part =
    region === undefined ? undefined : cutPart(swim[layer.from], swimAlpha[layer.from], region);
  if (part === undefined)
    throw new Error(`The swim ${layer.name} region is empty: check the settings.`);
  await writePng(join(SWIM_OUT, `${layer.name}.png`), part.rgba, part.box.width, part.box.height);
  swimLayers.push({
    name: layer.name,
    image: `swim/${layer.name}.png`,
    ...placeBox(part.box, swimPlacement),
    pivot: pivotIn(part.box, layer.pivot, swimPlacement.scale),
    parent: layer.parent,
    order: layer.order,
    rotate: layer.rotate,
    ...('stretch' in layer ? { stretch: layer.stretch } : {}),
    ...('accessory' in layer ? { accessory: true } : {}),
  });
  console.log(`swim ${layer.name.padEnd(9)} ${part.box.width}×${part.box.height} px`);
}

writeJson(RIG_FILE, {
  front: { artboard: ARTBOARD, layers: rigLayers },
  side: { artboard: ARTBOARD, layers: sideLayers },
  swim: { artboard: ARTBOARD, layers: swimLayers },
});

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

// The drawn poses. They are edits of front-goofy.png that leave his lower half untouched, so
// they are placed exactly like the front figure (same scale, same spot) and keep their colours:
// at the start of the cross-fade their lower half must match the layers pixel for pixel.
mkdirSync(DRAWN_OUT, { recursive: true });
const drawnPoses = [];
for (const drawn of DRAWN_POSES) {
  const drawnGoofy = await readRgb(`${DESIGN}/${drawn.file}-goofy.png`);
  const drawnPro = await readRgb(`${DESIGN}/${drawn.file}-professional.png`);
  assertSameSize(goofy, drawnGoofy, `The front view and the "${drawn.name}" drawn pose`);
  assertSameSize(drawnGoofy, drawnPro, `The goofy and professional "${drawn.name}" drawn poses`);
  const images: Record<
    string,
    { image: string; size: [number, number]; position: [number, number] }
  > = {};
  for (const [mood, image, suffix] of [
    ['goofy', drawnGoofy, ''],
    ['professional', drawnPro, '-pro'],
  ] as const) {
    const whole = cutPart(image, figureAlpha(image, findBackground(image)), () => 1);
    if (whole === undefined) throw new Error(`The ${mood} "${drawn.name}" drawn pose is empty.`);
    const file = `${drawn.name}${suffix}.png`;
    await writePng(join(DRAWN_OUT, file), whole.rgba, whole.box.width, whole.box.height);
    images[mood] = { image: `drawn/${file}`, ...placeBox(whole.box, PLACEMENT) };
  }
  // Edits of the front view, so they replace the front figure.
  drawnPoses.push({ name: drawn.name, figure: 'front', images });
  console.log(`drawn ${drawn.name}`);
}
writeJson(DRAWN_FILE, { poses: drawnPoses });

// The turntable views: the same plumage tone as the front view, his feet on the front view's
// ground line and his body centred on the same line. The professional version gets exactly the
// goofy version's correction, so the pair stays aligned.
const frontTone = plumageTone(goofy, bodyAlpha);
const groundOnArtboard =
  PLACEMENT.to[1] + (groundRow(bodyAlpha, goofy.width) - PLACEMENT.from[1]) * PLACEMENT.scale;
mkdirSync(VIEWS_OUT, { recursive: true });
const drawnViews = [];
for (const view of VIEWS) {
  const viewGoofy = await readRgb(`${DESIGN}/${view.file}.png`);
  const viewPro = await readRgb(`${DESIGN}/${view.file}-professional.png`);
  assertSameSize(viewGoofy, viewPro, `The two "${view.name}" views`);
  const goofyAlpha = figureAlpha(viewGoofy, findBackground(viewGoofy));
  const tone = plumageTone(viewGoofy, goofyAlpha);
  const placement: Placement = {
    scale: PLACEMENT.scale,
    from: [
      bodyCentreX(goofyAlpha, viewGoofy.width, ...BODY_ROWS),
      groundRow(goofyAlpha, viewGoofy.width),
    ],
    to: [PLACEMENT.to[0], groundOnArtboard],
  };
  const images: Record<
    string,
    { image: string; size: [number, number]; position: [number, number] }
  > = {};
  for (const [mood, image, suffix] of [
    ['goofy', viewGoofy, ''],
    ['professional', viewPro, '-pro'],
  ] as const) {
    const matched = matchTone(image, tone, frontTone);
    const whole = cutPart(matched, figureAlpha(matched, findBackground(image)), () => 1);
    if (whole === undefined) throw new Error(`The ${mood} "${view.name}" view is empty.`);
    const file = `${view.name}${suffix}.png`;
    await writePng(join(VIEWS_OUT, file), whole.rgba, whole.box.width, whole.box.height);
    images[mood] = { image: `views/${file}`, ...placeBox(whole.box, placement) };
  }
  drawnViews.push({ name: view.name, angle: view.angle, images });
  console.log(
    `view ${view.name.padEnd(9)} tone ${tone.map(Math.round).join(',')} → ${frontTone.map(Math.round).join(',')}`,
  );
}
writeJson(TURNTABLE_FILE, {
  views: [{ name: 'front', angle: 0, images: frontImages }, ...drawnViews, ...MIRRORS],
});

console.log(`Written: ${OUT}/, ${RIG_FILE}, ${TURNTABLE_FILE} and ${DRAWN_FILE}.`);
