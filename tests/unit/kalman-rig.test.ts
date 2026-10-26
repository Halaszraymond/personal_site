/**
 * Unit tests for Kálmán's rig maths and validation (spec: kalman-rig).
 *
 * Uses a small made-up rig, so the numbers are easy to follow by hand. The rig in the repo
 * is checked separately in kalman-rig-data.test.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  applyToPoint,
  compose,
  IDENTITY,
  multiply,
  resolvePose,
  REST_POSE,
  rotate,
  rotateAround,
  toSvgTransform,
  translate,
  validatePose,
  validateRig,
  type Pair,
  type Pose,
  type Rig,
  type RigLayer,
} from '../../src/lib/kalman-rig';

/** Compares two points with a tolerance, because turning involves sin and cos. */
function expectPointClose(actual: Pair, expected: Pair) {
  expect(actual[0]).toBeCloseTo(expected[0], 6);
  expect(actual[1]).toBeCloseTo(expected[1], 6);
}

// ---------------------------------------------------------------------------------------

describe('matrix helpers', () => {
  it('translate moves a point', () => {
    expect(applyToPoint(translate([10, -5]), [1, 2])).toEqual([11, -3]);
  });

  it('rotate turns clockwise on screen, because y points down', () => {
    // (1, 0) is to the right of the origin; 90° clockwise on screen puts it below: (0, 1).
    expectPointClose(applyToPoint(rotate(90), [1, 0]), [0, 1]);
  });

  it('multiply applies the second matrix first', () => {
    // Turn (1, 0) to (0, 1), then move by (10, 0): (10, 1). The other way round gives (0, 11).
    expectPointClose(applyToPoint(multiply(translate([10, 0]), rotate(90)), [1, 0]), [10, 1]);
    expectPointClose(applyToPoint(multiply(rotate(90), translate([10, 0])), [1, 0]), [0, 11]);
  });

  it('compose with nothing is the identity, and IDENTITY changes nothing', () => {
    expect(compose()).toEqual(IDENTITY);
    expect(applyToPoint(IDENTITY, [3, 4])).toEqual([3, 4]);
  });

  it('rotateAround keeps the pivot where it is and turns the rest around it', () => {
    const turn = rotateAround(90, [5, 5]);
    expectPointClose(applyToPoint(turn, [5, 5]), [5, 5]);
    expectPointClose(applyToPoint(turn, [6, 5]), [5, 6]);
  });

  it('toSvgTransform rounds and never writes -0', () => {
    expect(toSvgTransform(IDENTITY)).toBe('matrix(1 0 0 1 0 0)');
    expect(toSvgTransform(rotate(90))).toBe('matrix(0 1 -1 0 0 0)');
    expect(toSvgTransform(translate([1 / 3, -0]))).toBe('matrix(1 0 0 1 0.3333 0)');
  });
});

// ---------------------------------------------------------------------------------------

/** A layer with sensible defaults, so each test only states what matters to it. */
function layer(fields: Partial<RigLayer> & Pick<RigLayer, 'name'>): RigLayer {
  return {
    image: `${fields.name}.svg`,
    size: [100, 100],
    position: [0, 0],
    pivot: [50, 50],
    parent: 'body',
    order: 0,
    rotate: [-45, 45],
    ...fields,
  };
}

/** A tiny rig: a body, a head on top with glasses on it, and a far flipper behind the body. */
const RIG: Rig = {
  artboard: [400, 600],
  layers: [
    layer({
      name: 'body',
      parent: null,
      position: [100, 200],
      size: [200, 300],
      pivot: [100, 300],
      order: 20,
    }),
    layer({ name: 'head', position: [150, 100], pivot: [50, 100], order: 30 }),
    layer({
      name: 'glasses',
      parent: 'head',
      position: [160, 130],
      size: [80, 30],
      pivot: [40, 15],
      order: 40,
      accessory: true,
    }),
    layer({
      name: 'flipper',
      position: [80, 250],
      size: [40, 150],
      pivot: [20, 0],
      order: 10,
      rotate: [-30, 120],
    }),
  ],
};

/** The resolved layer by name, failing the test if it is missing. */
function resolved(rig: Rig, pose: Pose, name: string, mood: 'goofy' | 'professional' = 'goofy') {
  const found = resolvePose(rig, pose, mood).find((entry) => entry.name === name);
  if (found === undefined) throw new Error(`No layer ${name}`);
  return found;
}

const pose = (layers: Pose['layers']): Pose => ({ name: 'test', label: 'Test', layers });

describe('resolvePose', () => {
  it('puts every layer at its rest position in the rest pose', () => {
    for (const entry of resolvePose(RIG, REST_POSE, 'goofy')) {
      const rest = RIG.layers.find((l) => l.name === entry.name);
      expect(rest).toBeDefined();
      expect(entry.matrix).toEqual(translate(rest?.position ?? [0, 0]));
    }
  });

  it('turns a layer around its own pivot: the pivot stays put', () => {
    const atRest = resolved(RIG, REST_POSE, 'flipper').pivotOnArtboard;
    const turned = resolved(RIG, pose({ flipper: { rotate: 30 } }), 'flipper').pivotOnArtboard;
    expectPointClose(turned, atRest);
    expectPointClose(atRest, [100, 250]);
  });

  it('moves a layer by its offset', () => {
    const shifted = resolved(RIG, pose({ head: { offset: [5, -10] } }), 'head');
    expect(applyToPoint(shifted.matrix, [0, 0])).toEqual([155, 90]);
  });

  it('makes the glasses follow the head: same place relative to the head', () => {
    const tilted = pose({ head: { rotate: 20 } });
    const head = resolved(RIG, tilted, 'head');
    const glasses = resolved(RIG, tilted, 'glasses');
    // The glasses' centre at rest is (200, 145) on the artboard. Tilting the head turns
    // that point around the head's pivot (the neck at (200, 200)) by the same 20°.
    const expected = applyToPoint(rotateAround(20, [200, 200]), [200, 145]);
    expectPointClose(applyToPoint(glasses.matrix, [40, 15]), expected);
    // And the glasses turned exactly as much as the head did.
    expect(Math.atan2(glasses.matrix.b, glasses.matrix.a)).toBeCloseTo(
      Math.atan2(head.matrix.b, head.matrix.a),
      9,
    );
  });

  it('passes movement down the whole chain: turning the body moves head and glasses too', () => {
    const leaning = pose({ body: { rotate: 10 } });
    const bodyTurn = rotateAround(10, [200, 500]);
    expectPointClose(
      applyToPoint(resolved(RIG, leaning, 'glasses').matrix, [0, 0]),
      applyToPoint(bodyTurn, [160, 130]),
    );
  });

  it('adds the parent movement to the child’s own rotation', () => {
    const both = pose({ body: { rotate: 10 }, head: { rotate: 5 } });
    const head = resolved(RIG, both, 'head');
    expect((Math.atan2(head.matrix.b, head.matrix.a) * 180) / Math.PI).toBeCloseTo(15, 9);
  });

  it('draws by order, not by hierarchy: the flipper comes before (behind) the body', () => {
    expect(resolvePose(RIG, REST_POSE, 'goofy').map((entry) => entry.name)).toEqual([
      'flipper',
      'body',
      'head',
      'glasses',
    ]);
  });

  it('leaves layers the pose does not mention at rest', () => {
    const headOnly = pose({ head: { rotate: 15 } });
    expect(resolved(RIG, headOnly, 'flipper').matrix).toEqual(
      resolved(RIG, REST_POSE, 'flipper').matrix,
    );
  });

  it('shows accessories only in the professional mood, without changing the pose', () => {
    expect(resolved(RIG, REST_POSE, 'glasses', 'goofy').visible).toBe(false);
    expect(resolved(RIG, REST_POSE, 'glasses', 'professional').visible).toBe(true);
    expect(resolved(RIG, REST_POSE, 'head', 'goofy').visible).toBe(true);
    expect(resolved(RIG, REST_POSE, 'head', 'professional').matrix).toEqual(
      resolved(RIG, REST_POSE, 'head', 'goofy').matrix,
    );
  });
});

// ---------------------------------------------------------------------------------------

const allImagesExist = () => true;

/** The rig as plain JSON-like data, with some layers replaced. */
function rigWith(changes: Record<string, Partial<RigLayer>>, extra: RigLayer[] = []): unknown {
  return {
    artboard: RIG.artboard,
    layers: [...RIG.layers.map((l) => ({ ...l, ...changes[l.name] })), ...extra],
  };
}

/** The errors of a validation that must fail. */
function errorsOf(result: ReturnType<typeof validateRig> | ReturnType<typeof validatePose>) {
  if (result.ok) throw new Error('Expected the validation to fail.');
  return result.errors;
}

describe('validateRig', () => {
  it('accepts a valid rig', () => {
    expect(validateRig(rigWith({}), allImagesExist)).toEqual({ ok: true, value: RIG });
  });

  it('rejects a repeated layer name', () => {
    const errors = errorsOf(
      validateRig(rigWith({}, [layer({ name: 'head', order: 99 })]), allImagesExist),
    );
    expect(errors).toContain('The layer name "head" is used more than once.');
  });

  it('rejects an unknown parent, naming the layer and the parent', () => {
    const errors = errorsOf(validateRig(rigWith({ head: { parent: 'neck' } }), allImagesExist));
    expect(errors).toContain('Layer "head" has the parent "neck", which is not in the rig.');
  });

  it('rejects a parent loop and names it once', () => {
    const errors = errorsOf(
      validateRig(
        rigWith({ head: { parent: 'glasses' }, glasses: { parent: 'head' } }),
        allImagesExist,
      ),
    );
    expect(errors.filter((e) => e.startsWith('The parents form a loop'))).toEqual([
      'The parents form a loop: head → glasses → head.',
    ]);
  });

  it('rejects anything but exactly one root', () => {
    const errors = errorsOf(validateRig(rigWith({ head: { parent: null } }), allImagesExist));
    expect(errors).toContain('The rig needs exactly one layer without a parent; it has 2.');
  });

  it('rejects two layers with the same drawing order', () => {
    const errors = errorsOf(validateRig(rigWith({ head: { order: 20 } }), allImagesExist));
    expect(errors).toContain('Layers "body" and "head" share the drawing order 20.');
  });

  it('rejects an image that does not exist', () => {
    const errors = errorsOf(validateRig(rigWith({}), (image) => image !== 'head.svg'));
    expect(errors).toEqual(['Layer "head" uses the image "head.svg", which does not exist.']);
  });

  it('rejects an empty or inverted rotation range, and one without the rest position', () => {
    expect(
      errorsOf(validateRig(rigWith({ head: { rotate: [10, 10] } }), allImagesExist)),
    ).toContain('Layer "head" has an empty or inverted rotation range [10, 10].');
    expect(
      errorsOf(validateRig(rigWith({ head: { rotate: [20, -20] } }), allImagesExist)),
    ).toContain('Layer "head" has an empty or inverted rotation range [20, -20].');
    expect(errorsOf(validateRig(rigWith({ head: { rotate: [5, 20] } }), allImagesExist))).toContain(
      'Layer "head" has a rotation range [5, 20] without 0, its rest position.',
    );
  });

  it('rejects wrong types and unknown fields, reporting all of them at once', () => {
    const data = {
      artboard: [400, 0],
      layers: [
        {
          name: 'body',
          image: '',
          size: [0, 10],
          position: 'here',
          pivot: [1, 2],
          parent: 3,
          order: 'first',
          rotate: [0, 1],
          colour: 'navy',
        },
      ],
    };
    expect(errorsOf(validateRig(data, allImagesExist))).toEqual([
      'The rig needs an "artboard" as two numbers larger than zero.',
      'Layer "body" has an unknown field "colour".',
      'Layer "body" needs an "image" (a file name).',
      'Layer "body" needs "position" as two numbers.',
      'Layer "body" needs a "size" larger than zero.',
      'Layer "body" needs "parent" as a layer name or null.',
      'Layer "body" needs "order" as a number.',
    ]);
  });

  it('rejects something that is not a rig at all', () => {
    expect(errorsOf(validateRig([], allImagesExist))).toEqual(['The rig is not an object.']);
    expect(errorsOf(validateRig({ artboard: [1, 1], layers: [] }, allImagesExist))).toEqual([
      'The rig needs "layers" as a list with at least one layer.',
    ]);
  });
});

describe('validatePose', () => {
  it('accepts a valid pose', () => {
    const data = {
      name: 'wave',
      label: 'Wave',
      layers: { flipper: { rotate: 100, offset: [0, -5] } },
    };
    expect(validatePose(data, RIG)).toEqual({ ok: true, value: data });
  });

  it('rejects a layer that is not in the rig', () => {
    expect(
      errorsOf(validatePose({ name: 'x', label: 'X', layers: { tail: { rotate: 1 } } }, RIG)),
    ).toEqual(['Pose "x" names the layer "tail", which is not in the rig.']);
  });

  it('rejects a rotation outside the range, naming the pose, the layer and the range', () => {
    expect(
      errorsOf(validatePose({ name: 'nod', label: 'Nod', layers: { head: { rotate: 60 } } }, RIG)),
    ).toEqual(['Pose "nod" turns "head" by 60°, outside its range [-45, 45].']);
  });

  it('rejects values that are not finite numbers', () => {
    const data = {
      name: 'x',
      label: 'X',
      layers: { head: { rotate: '10', offset: [1, Number.NaN] } },
    };
    expect(errorsOf(validatePose(data, RIG))).toEqual([
      'Pose "x", layer "head": "rotate" must be a number.',
      'Pose "x", layer "head": "offset" must be two numbers.',
    ]);
  });

  it('rejects unknown fields and a missing name, label or layers', () => {
    expect(
      errorsOf(validatePose({ name: 'x', label: 'X', layers: { head: { scale: 2 } } }, RIG)),
    ).toEqual(['Pose "x", layer "head" has an unknown field "scale".']);
    expect(errorsOf(validatePose({}, RIG))).toEqual([
      'The pose needs a "name" (text).',
      'Pose "?" needs a "label" (text).',
      'Pose "?" needs "layers" as an object.',
    ]);
  });
});
