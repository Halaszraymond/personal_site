/**
 * Unit tests for the cutting logic (scripts/lib/kalman-cut.ts), on tiny made-up images that
 * can be checked by eye. Spec: kalman-rig, "Layers come from the design images" and
 * "Joints don't show".
 */
import { describe, expect, it } from 'vitest';
import {
  assertSameSize,
  bodyCentreX,
  cutPart,
  differenceAlpha,
  figureAlpha,
  findBackground,
  frontRegions,
  gapPerRow,
  groundRow,
  matchTone,
  pivotIn,
  placeBox,
  polygonCoverage,
  plumageTone,
  ramp,
  sideRegions,
  type FrontCutSettings,
  type SideCutSettings,
  type RawImage,
} from '../../scripts/lib/kalman-cut';

const WHITE = [255, 255, 255];
const DARK = [70, 80, 90];

/**
 * A small RGB image drawn from text: `.` is white background, `#` is dark plumage,
 * `o` is white belly (enclosed by plumage). Like a tiny pixel-art grid.
 */
function draw(rows: string[]): RawImage {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const data = new Uint8Array(width * height * 3);
  rows.forEach((row, y) =>
    [...row].forEach((char, x) => {
      const colour = char === '#' ? DARK : char === 'o' ? [250, 250, 252] : WHITE;
      data.set(colour, (y * width + x) * 3);
    }),
  );
  return { width, height, channels: 3, data };
}

const FIGURE = draw(['.......', '..###..', '.#ooo#.', '.#ooo#.', '..###..', '.......']);

describe('findBackground', () => {
  it('marks the white around the figure, but not the white belly inside it', () => {
    const background = findBackground(FIGURE);
    const at = (x: number, y: number) => background[y * FIGURE.width + x];
    expect(at(0, 0)).toBe(1);
    expect(at(6, 5)).toBe(1);
    expect(at(3, 2)).toBe(0); // belly
    expect(at(2, 1)).toBe(0); // plumage
  });
});

describe('figureAlpha', () => {
  it('is 0 on the background, 1 inside, and soft but never below 0.15 on the outline', () => {
    const background = findBackground(FIGURE);
    const alpha = figureAlpha(FIGURE, background);
    const at = (x: number, y: number) => alpha[y * FIGURE.width + x] ?? -1;
    expect(at(0, 0)).toBe(0);
    expect(at(3, 2)).toBe(1); // belly, not touching the background
    // Dark outline next to the background: (255 − 70) / 60 > 1, so solid.
    expect(at(2, 1)).toBe(1);
  });
});

describe('differenceAlpha and assertSameSize', () => {
  it('is 0 where the images are the same and 1 where they differ a lot', () => {
    const plain = draw(['....']);
    const changed: RawImage = { ...plain, data: plain.data.slice() };
    changed.data.set([128, 0, 128], 3); // the second pixel becomes purple, like the tie
    const alpha = differenceAlpha(plain, changed);
    expect([...alpha]).toEqual([0, 1, 0, 0]);
  });

  it('refuses images that are not the same size', () => {
    expect(() => assertSameSize(draw(['..']), draw(['...']), 'Front views')).toThrow(
      'Front views: the images must be the same size to line up, but they are 2×1 and 3×1.',
    );
  });
});

describe('gapPerRow', () => {
  it('finds the first background column after the figure, from the left', () => {
    const image = draw(['#.##..', '#.##..', '####..']);
    const gaps = gapPerRow(findBackground(image), image.width, 0, 3, 'left', 3);
    expect([...gaps]).toEqual([
      [0, 1],
      [1, 1],
      [2, undefined],
    ]);
  });

  it('does not count a white hole enclosed by the figure as a gap', () => {
    // The white pixel in the middle row touches no background, so it is part of the figure.
    const image = draw(['.###..', '.#.#..', '.###..']);
    const gaps = gapPerRow(findBackground(image), image.width, 1, 2, 'left', 3);
    expect(gaps.get(1)).toBeUndefined();
  });

  it('searches from the right edge for the right side', () => {
    const image = draw(['..##.#', '..##.#', '..####']);
    const gaps = gapPerRow(findBackground(image), image.width, 0, 2, 'right', 2);
    expect([...gaps]).toEqual([
      [0, 4],
      [1, 4],
    ]);
  });
});

describe('ramp', () => {
  it('goes from 0 to 1 between two rows', () => {
    const fade = ramp(10, 20);
    expect([fade(5), fade(15), fade(25)]).toEqual([0, 0.5, 1]);
  });
});

describe('cutPart', () => {
  it('keeps the region, crops to its box and puts the alpha in the fourth channel', () => {
    const image = draw(['....', '.##.', '....']);
    const alpha = figureAlpha(image, findBackground(image));
    const part = cutPart(image, alpha, (x) => (x === 2 ? 0.5 : 1));
    expect(part?.box).toEqual({ x: 1, y: 1, width: 2, height: 1 });
    expect([...(part?.rgba ?? [])]).toEqual([...DARK, 255, ...DARK, 128]);
  });

  it('returns nothing for an empty region', () => {
    const image = draw(['.#.']);
    expect(cutPart(image, figureAlpha(image, findBackground(image)), () => 0)).toBeUndefined();
  });
});

describe('placing on the artboard', () => {
  const placement = { scale: 2, from: [10, 5] as const, to: [800, 180] as const };

  it('turns a pixel box into a size and a position', () => {
    expect(placeBox({ x: 12, y: 5, width: 4, height: 3 }, placement)).toEqual({
      size: [8, 6],
      position: [804, 180],
    });
  });

  it('turns a joint into a pivot in the layer’s own coordinates', () => {
    expect(pivotIn({ x: 12, y: 5, width: 4, height: 3 }, [14, 7], 2)).toEqual([4, 4]);
  });
});

describe('bodyCentreX and groundRow', () => {
  it('finds the middle of the solid pixels in the given rows, and the lowest figure row', () => {
    const image = draw(['......', '.####.', '..##..', '......']);
    const alpha = figureAlpha(image, findBackground(image));
    expect(bodyCentreX(alpha, image.width, 1, 2)).toBe(2.5);
    expect(groundRow(alpha, image.width)).toBe(2);
  });
});

describe('plumageTone and matchTone', () => {
  it('measures the dark plumage only, and shifts it to a target tone', () => {
    const image = draw(['.#o.']);
    const alpha = new Float32Array([1, 1, 1, 1]);
    expect(plumageTone(image, alpha)).toEqual([70, 80, 90]);

    const matched = matchTone(image, [70, 80, 90], [50, 60, 70]);
    expect([...matched.data.slice(3, 6)]).toEqual([50, 60, 70]);
    // White stays white.
    expect([...matched.data.slice(0, 3)]).toEqual([255, 255, 255]);
  });
});

describe('frontRegions: the joints', () => {
  // A made-up front view 40 wide: centre at 20, the flipper gap from row 20 on.
  const settings: FrontCutSettings = {
    centreX: 20,
    neck: { headFadeFrom: 4, headFadeTo: 8, bodyFrom: 3, bodySolid: 6 },
    shoulderRow: 8,
    flipper: {
      fromRow: 8,
      toRow: 30,
      gapFromRow: 20,
      shoulder: [12, 8],
      gapTop: [6, 20],
      underlap: 2,
    },
    bodyBottomRow: 34,
    feet: { fromRow: 33, leftMaxX: 16, rightMinX: 24 },
    tail: { fromRow: 32, toRow: 36, minX: 17, maxX: 23 },
    glasses: [14, 1, 26, 4],
    tie: [15, 6, 25, 20],
  };
  const leftGap = new Map([[25, 7]]);
  const rightGap = new Map([[25, 33]]);
  const regions = frontRegions(settings, leftGap, rightGap);
  const take = (part: string, x: number, y: number) => regions[part]?.(x, y);

  it('fades the head out over the neck while the body fades in under it', () => {
    expect([take('head', 20, 3), take('head', 20, 6), take('head', 20, 9)]).toEqual([1, 0.5, 0]);
    expect([take('body', 20, 2), take('body', 20, 4), take('body', 20, 7)]).toEqual([0, 1 / 3, 1]);
  });

  it('gives the body the full width above the shoulders', () => {
    expect(take('body', 1, 7)).toBe(1);
  });

  it('lets a flipper reach under the body above the gap', () => {
    // At row 14 the shoulder cut is at x 9: the body starts there, the flipper reaches 2 further.
    expect(take('body', 9, 14)).toBe(1);
    expect(take('flipperLeft', 10, 14)).toBe(1);
    expect(take('flipperLeft', 11, 14)).toBe(0);
  });

  it('shares no pixel between flipper and body below the gap', () => {
    // Row 25: the gap is at column 7.
    expect([take('flipperLeft', 6, 25), take('body', 6, 25)]).toEqual([1, 0]);
    expect([take('flipperLeft', 7, 25), take('body', 7, 25)]).toEqual([0, 1]);
    // The right side is the same at its own gap.
    expect([take('flipperRight', 34, 25), take('body', 33, 25)]).toEqual([1, 1]);
    expect(take('flipperRight', 33, 25)).toBe(0);
  });

  it('keeps the professional extras inside their own boxes', () => {
    expect([take('glasses', 20, 2), take('glasses', 30, 2)]).toEqual([1, 0]);
    expect([take('tie', 20, 10), take('tie', 20, 25)]).toEqual([1, 0]);
  });
});

describe('polygonCoverage', () => {
  it('is 1 inside, 0 outside and partly covered on a slanted edge', () => {
    // A square from (1, 1) to (3, 3) on a 4 × 4 image.
    const square = polygonCoverage(
      [
        [1, 1],
        [3, 1],
        [3, 3],
        [1, 3],
      ],
      4,
      4,
    );
    expect([...square]).toEqual([0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0]);

    // A triangle over the bottom-left half of a 2 × 2 image: the diagonal pixels are half covered.
    const triangle = polygonCoverage(
      [
        [0, 0],
        [2, 2],
        [0, 2],
      ],
      2,
      2,
      8,
    );
    // Sample points exactly on the diagonal count as outside, so it is just under a half.
    expect(Math.abs((triangle[0] ?? 0) - 0.5)).toBeLessThan(0.1);
    expect(triangle[2]).toBe(1);
    expect(triangle[1]).toBe(0);
  });
});

describe('sideRegions', () => {
  const settings: SideCutSettings = {
    neck: { headFadeFrom: 4, headFadeTo: 8, bodyFrom: 3, bodySolid: 6 },
    bodyBottomRow: 30,
    tail: { fromRow: 26, minX: 30, bodyOverlap: 2 },
    feet: { fromRow: 28, backMaxX: 12, backMaxRow: 31 },
    glasses: [10, 1, 20, 4],
    tie: [8, 6, 14, 18],
  };
  // A 40-wide image with a flipper covering column 25 from row 10 to 19.
  const flipper = new Float32Array(40 * 40);
  for (let y = 10; y < 20; y++) flipper[y * 40 + 25] = 1;
  const regions = sideRegions(settings, flipper, 40);
  const take = (part: string, x: number, y: number) => regions[part]?.(x, y);

  it('takes the flipper from its traced outline, and the body under it as well', () => {
    expect([take('flipper', 25, 15), take('flipper', 24, 15)]).toEqual([1, 0]);
    // The body (from the image without the flipper) also covers that pixel: painted body
    // shows when the flipper swings away.
    expect(take('body', 25, 15)).toBe(1);
  });

  it('keeps the tail out of the body, except a little overlap at the joint', () => {
    // The first two tail rows are in both (the body hides the joint), below that only the tail.
    expect([take('tail', 32, 27), take('body', 32, 27)]).toEqual([1, 1]);
    expect([take('tail', 32, 29), take('body', 32, 29)]).toEqual([1, 0]);
  });

  it('splits the feet into the back foot (left, upper) and the front foot', () => {
    expect([take('footBack', 10, 29), take('footFront', 10, 29)]).toEqual([1, 0]);
    expect([take('footBack', 10, 32), take('footFront', 10, 32)]).toEqual([0, 1]);
    expect([take('footBack', 20, 29), take('footFront', 20, 29)]).toEqual([0, 1]);
  });

  it('fades the head into the neck', () => {
    expect([take('head', 5, 3), take('head', 5, 6), take('head', 5, 9)]).toEqual([1, 0.5, 0]);
  });
});
