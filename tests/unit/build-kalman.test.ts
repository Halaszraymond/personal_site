/**
 * Unit tests for buildKalman() (spec: kalman-config): determinism, accessories, the
 * emperor's features at the extremes, and the triangle and draw-call budget.
 * Three.js builds geometry without a browser, so this runs in plain Node.
 */
import { BufferGeometry, Color, Mesh, SRGBColorSpace, type Group } from 'three';
import { describe, expect, it } from 'vitest';
import { defaultConfig, KALMAN_PARAMETERS, type KalmanConfig } from '../../src/lib/kalman-config';
import { rgbToHsl, silhouette, uAtHeight } from '../../src/lib/kalman-shape';
import { buildKalman, modelStats, PART, poseFlippers } from '../../src/scene/kalman/build-kalman';

/** A config with every range parameter at its minimum or maximum, switches as given. */
function extreme(end: 'min' | 'max', switches: boolean): KalmanConfig {
  const config: Record<string, unknown> = { ...defaultConfig() };
  for (const parameter of KALMAN_PARAMETERS) {
    if (parameter.kind === 'range') config[parameter.key] = parameter[end];
    if (parameter.kind === 'switch') config[parameter.key] = switches;
  }
  return config as KalmanConfig;
}

/** The geometry of a named mesh. */
function geometryOf(kalman: Group, name: string): BufferGeometry {
  const mesh = kalman.getObjectByName(name);
  if (!(mesh instanceof Mesh)) throw new Error(`No mesh named ${name}`);
  return mesh.geometry as BufferGeometry;
}

/** One face of a mesh: where its centre is and its colour (converted back to sRGB). */
interface Face {
  x: number;
  y: number;
  z: number;
  hue: number;
  saturation: number;
  lightness: number;
}

function facesOf(geometry: BufferGeometry): Face[] {
  const positions = geometry.getAttribute('position');
  const colours = geometry.getAttribute('color');
  const faces: Face[] = [];
  const colour = new Color();
  const srgb = { r: 0, g: 0, b: 0 };
  for (let vertex = 0; vertex < positions.count; vertex += 3) {
    const centre = [0, 1, 2].reduce(
      (sum, corner) => ({
        x: sum.x + positions.getX(vertex + corner) / 3,
        y: sum.y + positions.getY(vertex + corner) / 3,
        z: sum.z + positions.getZ(vertex + corner) / 3,
      }),
      { x: 0, y: 0, z: 0 },
    );
    colour.setRGB(colours.getX(vertex), colours.getY(vertex), colours.getZ(vertex));
    colour.getRGB(srgb, SRGBColorSpace);
    faces.push({ ...centre, ...rgbToHsl(srgb) });
  }
  return faces;
}

const CONFIGS = {
  defaults: defaultConfig(),
  minimum: extreme('min', false),
  maximum: extreme('max', true),
};

describe('buildKalman', () => {
  it('builds the same model from the same config', () => {
    const first = buildKalman(defaultConfig());
    const second = buildKalman(defaultConfig());
    for (const name of [PART.body, PART.bill]) {
      const a = geometryOf(first, name);
      const b = geometryOf(second, name);
      expect(Array.from(a.getAttribute('position').array)).toEqual(
        Array.from(b.getAttribute('position').array),
      );
      expect(Array.from(a.getAttribute('color').array)).toEqual(
        Array.from(b.getAttribute('color').array),
      );
    }
  });

  it('adds the tie and glasses only when switched on', () => {
    const plain = buildKalman({ ...defaultConfig(), tieOn: false, glassesOn: false });
    const tieOnly = buildKalman({ ...defaultConfig(), tieOn: true, glassesOn: false });
    const both = buildKalman({ ...defaultConfig(), tieOn: true, glassesOn: true });
    expect(plain.getObjectByName(PART.tie)).toBeUndefined();
    expect(plain.getObjectByName(PART.glasses)).toBeUndefined();
    expect(tieOnly.getObjectByName(PART.tie)).toBeDefined();
    expect(tieOnly.getObjectByName(PART.glasses)).toBeUndefined();
    expect(both.getObjectByName(PART.glasses)).toBeDefined();
  });

  it('swings the flippers in mirror image', () => {
    const kalman = buildKalman(defaultConfig());
    poseFlippers(kalman, 0.4);
    const left = kalman.getObjectByName(PART.flipperLeft)?.rotation.z ?? 0;
    const right = kalman.getObjectByName(PART.flipperRight)?.rotation.z ?? 0;
    expect(right).toBeGreaterThan(0.4);
    expect(left).toBeCloseTo(-right);
  });
});

describe('the emperor features survive every valid config', () => {
  for (const [name, config] of Object.entries(CONFIGS)) {
    describe(name, () => {
      const kalman = buildKalman(config);
      const profile = silhouette(config);
      const body = facesOf(geometryOf(kalman, PART.body)).map((face) => ({
        ...face,
        u: uAtHeight(profile, face.y),
        angle: Math.abs(Math.atan2(face.x, face.z)),
      }));

      it('has a dark back', () => {
        const back = body.filter((f) => f.u > 0.2 && f.u < 0.5 && f.angle > 2.6);
        expect(back.length).toBeGreaterThan(0);
        for (const face of back) expect(face.lightness).toBeLessThan(0.15);
      });

      it('has a white belly', () => {
        const belly = body.filter((f) => f.u > 0.15 && f.u < 0.45 && f.angle < 0.5);
        expect(belly.length).toBeGreaterThan(0);
        for (const face of belly) expect(face.lightness).toBeGreaterThan(0.85);
      });

      it('has golden-orange ear patches', () => {
        const patch = body.filter(
          (f) => f.saturation > 0.5 && f.hue >= 28 && f.hue <= 52 && f.u > 0.6,
        );
        expect(patch.length).toBeGreaterThanOrEqual(2); // at least one per side
        expect(patch.some((f) => f.x > 0) && patch.some((f) => f.x < 0)).toBe(true);
      });

      it('has an orange-to-pink stripe on the bill', () => {
        const bill = facesOf(geometryOf(kalman, PART.bill));
        const stripe = bill.filter((f) => f.saturation > 0.5 && (f.hue <= 40 || f.hue >= 330));
        const dark = bill.filter((f) => f.lightness < 0.15);
        expect(stripe.length).toBeGreaterThan(0);
        expect(dark.length).toBeGreaterThan(0);
      });
    });
  }
});

describe('Kálmán stays low-poly', () => {
  it('stays within 8,000 triangles and 20 draw calls at maximum detail', () => {
    const stats = modelStats(buildKalman(extreme('max', true)));
    expect(stats.triangles).toBeLessThanOrEqual(8000);
    expect(stats.meshes).toBeLessThanOrEqual(20);
  });
});
