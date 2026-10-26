/**
 * Unit tests for the shape logic behind Kálmán (src/lib/kalman-shape.ts).
 */
import { describe, expect, it } from 'vitest';
import { defaultConfig, KALMAN_PARAMETERS, type KalmanConfig } from '../../src/lib/kalman-config';
import {
  bellyFactor,
  billStripeColour,
  CHEST_POINT,
  EAR_POINT,
  bodyColourAt,
  earPatchWeight,
  facetSegments,
  headDepthScale,
  hslToRgb,
  PLUMAGE,
  postureShift,
  rgbToHsl,
  silhouette,
  smoothProfile,
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

const EAR = EAR_POINT;
const CHEST = CHEST_POINT;

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
    expect(earPatchWeight(halfway.u, halfway.angle, 0)).toBeLessThan(0.15);
  });

  it('stays off the back and the belly', () => {
    expect(earPatchWeight(0.4, Math.PI, 1)).toBeLessThan(0.01);
    expect(earPatchWeight(0.3, 0, 1)).toBeLessThan(0.01);
  });
});

describe('bodyColourAt', () => {
  it('is dark navy on the back and cream on the belly', () => {
    // Compared with a tolerance: the ear patch's bell curve never
    // reaches exactly zero, so a 1e-15 trace of orange is mixed in everywhere.
    const back = bodyColourAt(0.4, Math.PI, defaultConfig());
    const belly = bodyColourAt(0.3, 0, defaultConfig());
    for (const channel of ['r', 'g', 'b'] as const) {
      expect(back[channel]).toBeCloseTo(PLUMAGE.dark[channel], 6);
      expect(belly[channel]).toBeCloseTo(PLUMAGE.light[channel], 6);
    }
  });

  it('washes the upper chest pale yellow, fading down into the cream belly', () => {
    const upper = rgbToHsl(bodyColourAt((8 - 0.6) / 14, 0, defaultConfig()));
    const lower = rgbToHsl(bodyColourAt(0.3, 0, defaultConfig()));
    expect(upper.hue).toBeGreaterThan(30);
    expect(upper.hue).toBeLessThan(60);
    expect(upper.saturation).toBeGreaterThan(lower.saturation);
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
  it('adds faces per level, many more in the smooth look', () => {
    expect([0, 1, 2, 3].map((level) => facetSegments(level, true))).toEqual([7, 9, 12, 16]);
    expect([0, 1, 2, 3].map((level) => facetSegments(level, false))).toEqual([16, 22, 28, 34]);
  });
});

describe('smoothProfile', () => {
  const profile = silhouette(defaultConfig());

  it('leaves the faceted look unchanged', () => {
    expect(smoothProfile(profile, 1)).toEqual(profile);
  });

  it('passes through every original point and keeps rising', () => {
    const smooth = smoothProfile(profile, 3);
    expect(smooth).toHaveLength((profile.length - 1) * 3 + 1);
    profile.forEach((point, index) => {
      expect(smooth[index * 3]?.y).toBeCloseTo(point.y);
      expect(smooth[index * 3]?.radius).toBeCloseTo(point.radius);
    });
    for (let index = 1; index < smooth.length; index++) {
      expect(smooth[index]?.y).toBeGreaterThan(smooth[index - 1]?.y ?? Infinity);
      expect(smooth[index]?.radius).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('posture', () => {
  it('moves the head forward and stretches it, but leaves the body alone', () => {
    expect(postureShift(0.2)).toBe(0);
    expect(postureShift(0.9)).toBeGreaterThan(0);
    expect(headDepthScale(0.3)).toBe(1);
    expect(headDepthScale(0.75)).toBeGreaterThan(1);
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
