/**
 * Unit tests for the shape logic behind Kálmán (src/lib/kalman-shape.ts).
 */
import { describe, expect, it } from 'vitest';
import { defaultConfig, KALMAN_PARAMETERS, type KalmanConfig } from '../../src/lib/kalman-config';
import {
  bellyFactor,
  billStripeColour,
  bodyColourAt,
  earPatchWeight,
  facetSegments,
  hslToRgb,
  PLUMAGE,
  rgbToHsl,
  silhouette,
  strokeAngle,
  uAtHeight,
} from '../../src/lib/kalman-shape';

/** A config with every range parameter at its minimum or maximum. */
function extreme(end: 'min' | 'max'): KalmanConfig {
  const config: Record<string, unknown> = { ...defaultConfig() };
  for (const parameter of KALMAN_PARAMETERS) {
    if (parameter.kind === 'range') config[parameter.key] = parameter[end];
  }
  return config as KalmanConfig;
}

const EAR = { u: (8 + 0.4) / 12, angle: 1.75 };
const CHEST = { u: (7 - 1.2) / 12, angle: 0.35 };

describe('silhouette', () => {
  for (const [name, config] of [
    ['defaults', defaultConfig()],
    ['minimum', extreme('min')],
    ['maximum', extreme('max')],
  ] as const) {
    it(`is closed and only goes up (${name})`, () => {
      const profile = silhouette(config);
      expect(profile[0]?.radius).toBe(0);
      expect(profile.at(-1)?.radius).toBe(0);
      for (let index = 1; index < profile.length; index++) {
        expect(profile[index]?.y).toBeGreaterThan(profile[index - 1]?.y ?? Infinity);
      }
    });
  }

  it('grows with height and girth', () => {
    const tall = silhouette({ ...defaultConfig(), bodyHeight: 1.15, bodyGirth: 1.25 });
    const base = silhouette(defaultConfig());
    expect(tall.at(-1)?.y).toBeGreaterThan(base.at(-1)?.y ?? Infinity);
    expect(tall[3]?.radius).toBeGreaterThan(base[3]?.radius ?? Infinity);
  });
});

describe('uAtHeight', () => {
  it('runs from 0 at the bottom to 1 at the top', () => {
    const profile = silhouette(defaultConfig());
    expect(uAtHeight(profile, 0)).toBe(0);
    expect(uAtHeight(profile, profile.at(-1)?.y ?? 0)).toBeCloseTo(1);
  });
});

describe('earPatchWeight', () => {
  it('is full at the ear, on both sides', () => {
    expect(earPatchWeight(EAR.u, EAR.angle, 0.5)).toBeCloseTo(1);
    expect(earPatchWeight(EAR.u, -EAR.angle, 0.5)).toBeCloseTo(1);
  });

  it('fades down towards the chest', () => {
    const halfway = { u: (EAR.u + CHEST.u) / 2, angle: (EAR.angle + CHEST.angle) / 2 };
    const atEar = earPatchWeight(EAR.u, EAR.angle, 1);
    const atHalfway = earPatchWeight(halfway.u, halfway.angle, 1);
    const atChest = earPatchWeight(CHEST.u, CHEST.angle, 1);
    expect(atHalfway).toBeLessThan(atEar);
    expect(atChest).toBeLessThan(atHalfway);
  });

  it('reaches further down with more spread', () => {
    const halfway = { u: (EAR.u + CHEST.u) / 2, angle: (EAR.angle + CHEST.angle) / 2 };
    expect(earPatchWeight(halfway.u, halfway.angle, 1)).toBeGreaterThan(0.3);
    expect(earPatchWeight(halfway.u, halfway.angle, 0)).toBeLessThan(0.05);
  });

  it('stays off the back and the belly', () => {
    expect(earPatchWeight(0.4, Math.PI, 1)).toBeLessThan(0.01);
    expect(earPatchWeight(0.3, 0, 1)).toBeLessThan(0.01);
  });
});

describe('bodyColourAt', () => {
  it('is black on the back and white on the belly', () => {
    // Compared with a tolerance: the ear patch's bell curve never
    // reaches exactly zero, so a 1e-15 trace of orange is mixed in everywhere.
    const back = bodyColourAt(0.4, Math.PI, defaultConfig());
    const belly = bodyColourAt(0.3, 0, defaultConfig());
    for (const channel of ['r', 'g', 'b'] as const) {
      expect(back[channel]).toBeCloseTo(PLUMAGE.black[channel], 6);
      expect(belly[channel]).toBeCloseTo(PLUMAGE.white[channel], 6);
    }
  });

  it('is golden-orange at the ear, within the hue range', () => {
    for (const config of [extreme('min'), extreme('max')]) {
      const { hue, saturation } = rgbToHsl(bodyColourAt(EAR.u, EAR.angle, config));
      expect(hue).toBeGreaterThanOrEqual(28);
      expect(hue).toBeLessThanOrEqual(52);
      expect(saturation).toBeGreaterThan(0.5);
    }
  });
});

describe('colour helpers', () => {
  it('converts HSL to RGB and back', () => {
    const { hue, saturation, lightness } = rgbToHsl(hslToRgb(40, 0.95, 0.52));
    expect(hue).toBeCloseTo(40);
    expect(saturation).toBeCloseTo(0.95);
    expect(lightness).toBeCloseTo(0.52);
  });

  it('runs the bill stripe from orange to pink', () => {
    expect(billStripeColour(0)).toEqual(PLUMAGE.billOrange);
    expect(billStripeColour(1)).toEqual(PLUMAGE.billPink);
  });
});

describe('bellyFactor', () => {
  it('only pushes out the front, more with more roundness', () => {
    expect(bellyFactor(0.3, Math.PI, 1)).toBe(1);
    expect(bellyFactor(0.3, 0, 0)).toBe(1);
    expect(bellyFactor(0.3, 0, 1)).toBeGreaterThan(bellyFactor(0.3, 0, 0.5));
  });
});

describe('facetSegments', () => {
  it('adds faces per level', () => {
    expect([0, 1, 2, 3].map(facetSegments)).toEqual([7, 9, 12, 16]);
  });
});

describe('strokeAngle', () => {
  it('stays within the amplitude', () => {
    const limit = (30 * Math.PI) / 180;
    for (let t = 0; t < 2; t += 0.05) {
      expect(Math.abs(strokeAngle(t, 30, 1))).toBeLessThanOrEqual(limit + 1e-12);
    }
  });

  it('repeats once per 1 / speed seconds', () => {
    expect(strokeAngle(0.3, 30, 2)).toBeCloseTo(strokeAngle(0.3 + 0.5, 30, 2));
    expect(strokeAngle(0.125, 30, 2)).toBeCloseTo((30 * Math.PI) / 180);
  });
});
