/**
 * Unit tests for the turntable maths (src/lib/kalman-turntable.ts).
 */
import { describe, expect, it } from 'vitest';
import { applyToPoint } from '../../src/lib/kalman-rig';
import {
  canTurn,
  normaliseAngle,
  turntableErrors,
  viewImages,
  turntableFrame,
  viewMatrix,
  type ViewFrame,
} from '../../src/lib/kalman-turntable';

const VIEWS = [
  { name: 'front', angle: 0 },
  { name: 'side-right', angle: 90 },
  { name: 'back', angle: 180 },
  { name: 'side-left', angle: 270 },
];

const names = (frames: ViewFrame[]) => frames.map((frame) => frame.name);

describe('normaliseAngle', () => {
  it('maps every angle onto 0–360', () => {
    expect(normaliseAngle(0)).toBe(0);
    expect(normaliseAngle(-90)).toBe(270);
    expect(normaliseAngle(450)).toBe(90);
    expect(normaliseAngle(360)).toBe(0);
  });
});

describe('turntableFrame', () => {
  it('shows exactly one view, unsqueezed, at a drawn angle', () => {
    expect(turntableFrame(VIEWS, 180)).toEqual([{ name: 'back', opacity: 1, scaleX: 1 }]);
    expect(turntableFrame(VIEWS, -90)).toEqual([{ name: 'side-left', opacity: 1, scaleX: 1 }]);
  });

  it('squeezes the current view on the way, without fading yet', () => {
    const [frame] = turntableFrame(VIEWS, 20);
    expect(frame?.name).toBe('front');
    expect(frame?.opacity).toBe(1);
    expect(frame?.scaleX).toBeLessThan(1);
  });

  it('fades the next view in on top halfway, at the narrowest point', () => {
    const frames = turntableFrame(VIEWS, 45);
    // Back to front: the outgoing view stays solid underneath, the next one is half faded in.
    expect(names(frames)).toEqual(['front', 'side-right']);
    expect(frames[0]?.opacity).toBe(1);
    expect(frames[1]?.opacity).toBeCloseTo(0.5);
    expect(frames[0]?.scaleX).toBeCloseTo(0.65);
  });

  it('drops the outgoing view once the next one is fully in', () => {
    expect(names(turntableFrame(VIEWS, 52))).toEqual(['side-right']);
  });

  it('wraps round from the last view to the first', () => {
    expect(names(turntableFrame(VIEWS, 315))).toEqual(['side-left', 'front']);
    expect(names(turntableFrame(VIEWS, 350))).toEqual(['front']);
  });

  it('only shows the next view near the end of the way', () => {
    expect(names(turntableFrame(VIEWS, 80))).toEqual(['side-right']);
  });

  it('copes with a single view and with no views', () => {
    expect(turntableFrame([{ name: 'front', angle: 0 }], 123)).toEqual([
      { name: 'front', opacity: 1, scaleX: 1 },
    ]);
    expect(turntableFrame([], 10)).toEqual([]);
  });
});

describe('viewMatrix', () => {
  it('places the image, then squeezes it around the centre line', () => {
    const matrix = viewMatrix(0.5, 800, [700, 100]);
    // The image's top-left corner (0, 0) sits at (700, 100), 100 left of the centre line;
    // squeezed to half width it ends up 50 left of it.
    expect(applyToPoint(matrix, [0, 0])).toEqual([750, 100]);
    // A point on the centre line doesn't move sideways.
    expect(applyToPoint(matrix, [100, 0])).toEqual([800, 100]);
  });
});

describe('turntableErrors', () => {
  const image = { image: 'a.png', size: [10, 20], position: [0, 0] };
  const view = (name: string, angle: number) => ({
    name,
    angle,
    images: { goofy: image, professional: image },
  });

  it('accepts valid views', () => {
    expect(turntableErrors({ views: [view('front', 0), view('back', 180)] })).toEqual([]);
  });

  it('reports every problem at once', () => {
    expect(
      turntableErrors({
        views: [view('front', 0), view('front', 360), { name: 'x', angle: 0, images: {} }],
      }),
    ).toEqual([
      'View "front" is listed twice.',
      'View "front" needs an "angle" from 0 up to 360.',
      'View "x" shares its angle 0 with another view.',
      'View "x" needs a "goofy" image with "image", "size" and "position".',
      'View "x" needs a "professional" image with "image", "size" and "position".',
    ]);
  });

  it('accepts a mirrored view at the opposite angle of a drawn one', () => {
    const mirror = { name: 'side-mirrored', angle: 270, mirrorOf: 'side' };
    expect(turntableErrors({ views: [view('front', 0), view('side', 90), mirror] })).toEqual([]);
  });

  it('rejects a mirror of nothing, or at the wrong angle', () => {
    expect(
      turntableErrors({
        views: [
          view('front', 0),
          view('side', 90),
          { name: 'a', angle: 200, mirrorOf: 'side' },
          { name: 'b', angle: 300, mirrorOf: 'tail' },
        ],
      }),
    ).toEqual([
      'View "a" must be at the opposite angle of "side".',
      'View "b" mirrors "tail", which is not a drawn view.',
    ]);
  });

  it('rejects something without views', () => {
    expect(turntableErrors({})).toEqual(['The turntable needs a list of "views".']);
  });
});

describe('viewImages', () => {
  const image = { image: 'side.png', size: [10, 20] as const, position: [0, 0] as const };
  const views = [
    { name: 'side', angle: 90, images: { goofy: image, professional: image } },
    { name: 'side-mirrored', angle: 270, mirrorOf: 'side' },
  ];

  it('gives a drawn view its own images, not flipped', () => {
    expect(viewImages(views, 'side')).toEqual({ images: views[0]?.images, mirrored: false });
  });

  it('gives a mirrored view its source’s images, flipped', () => {
    expect(viewImages(views, 'side-mirrored')).toEqual({
      images: views[0]?.images,
      mirrored: true,
    });
  });

  it('knows nothing about unknown views', () => {
    expect(viewImages(views, 'top')).toBeUndefined();
  });
});

describe('viewMatrix for a mirrored view', () => {
  it('flips the image around the centre line', () => {
    // An image placed from x 700 to 900 around the centre line 800, flipped:
    // its left edge (700) ends up at 900 and its right edge (900) at 700.
    const matrix = viewMatrix(-1, 800, [700, 0]);
    expect(applyToPoint(matrix, [0, 0])).toEqual([900, 0]);
    expect(applyToPoint(matrix, [200, 0])).toEqual([700, 0]);
  });
});

describe('canTurn', () => {
  it('needs at least two views (spec: "Only the front view")', () => {
    expect(canTurn([{ name: 'front', angle: 0 }])).toBe(false);
    expect(canTurn([])).toBe(false);
    expect(canTurn(VIEWS)).toBe(true);
  });
});
